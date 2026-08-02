import Venta   from "../models/Venta.js";
import Gasto   from "../models/Gastos.js";
import Cliente from "../models/Cliente.js";
import Empresa from "../models/Empresa.js";

// ── Helpers privados (NO exportar) ─────────────────────────────────────────

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ultimosMeses = (n = 6) => {
    const ahora = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - (n - 1 - i), 1);
        return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
    });
};

const getRangoFechas = (filtro) => {
    const ahora = new Date();
    const inicio = new Date(ahora);
    inicio.setHours(0, 0, 0, 0);

    if (filtro === "hoy") {
        // inicio ya es HOY a las 00:00
    } else if (filtro === "semana") {
        const diaSemana = inicio.getDay(); // 0 (Dom) a 6 (Sab)
        const diff = inicio.getDate() - diaSemana + (diaSemana === 0 ? -6 : 1); // Ajustar al Lunes
        inicio.setDate(diff);
    } else {
        // "mes" por defecto
        inicio.setDate(1);
    }
    return { inicio, fin: ahora };
};

// ── Función Pública Exportada ──────────────────────────────────────────────

export const getDashboardStats = async (businessId, tiempo = "mes") => {
    const { inicio } = getRangoFechas(tiempo);
    const ahora = new Date();
    const haceSeismeses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);
    const hace30dias = new Date(ahora);
    hace30dias.setDate(ahora.getDate() - 30);
    const hace20dias = new Date(ahora);
    hace20dias.setDate(ahora.getDate() - 20);

    // 1. KPIs del Periodo Solicitado
    const [resVentas = {}] = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicio }, $expr: { $gt: [{ $size: "$items" }, 0] } } },
        { $group: { _id: null, total: { $sum: "$total" }, cantidad: { $sum: 1 } } },
    ]);
    const [resCobros = {}] = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicio } } },
        { $group: { _id: null, cobrado: { $sum: "$monto_pagado" } } },
    ]);
    const [resGastos = {}] = await Gasto.aggregate([
        { $match: { businessId, fecha: { $gte: inicio } } },
        { $group: { _id: null, total: { $sum: "$monto" } } },
    ]);
    const [resDeudaGenerada = {}] = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicio }, $expr: { $gt: [{ $size: "$items" }, 0] } } },
        { $group: {
            _id:   null,
            total: { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } },
        }},
    ]);

    // 2. Deuda Global Histórica (siempre es todo lo pendiente, no filtrado)
    const [resDeudaGlobal = {}] = await Venta.aggregate([
        { $match: { businessId, $expr: { $gt: [{ $size: "$items" }, 0] } } },
        { $group: {
            _id:   null,
            total: { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } },
        }},
    ]);

    // 3. Evolución a largo plazo (6 meses)
    const ingresosPorMes = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: haceSeismeses } } },
        { $group: { _id: { anio: { $year: "$fecha" }, mes: { $month: "$fecha" } }, ingresos: { $sum: "$monto_pagado" } } },
    ]);
    const gastosPorMes = await Gasto.aggregate([
        { $match: { businessId, fecha: { $gte: haceSeismeses } } },
        { $group: { _id: { anio: { $year: "$fecha" }, mes: { $month: "$fecha" } }, gastos: { $sum: "$monto" } } },
    ]);

    const ingMap  = Object.fromEntries(ingresosPorMes.map(({ _id, ingresos }) => [`${_id.anio}-${_id.mes}`, ingresos]));
    const gastMap = Object.fromEntries(gastosPorMes.map(({ _id, gastos }) => [`${_id.anio}-${_id.mes}`, gastos]));
    const evolucion = ultimosMeses(6).map(({ anio, mes }) => ({
        nombre:   MESES[mes - 1],
        ingresos: ingMap[`${anio}-${mes}`] || 0,
        gastos:   gastMap[`${anio}-${mes}`] || 0,
    }));

    // 4. Productos y Pagos del Periodo Solicitado
    const productosRaw = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicio } } },
        { $unwind: "$items" },
        { $group: { _id: "$items.producto", cantidad: { $sum: "$items.cantidad" } } },
        { $sort: { cantidad: -1 } },
    ]);
    const productosMasVendidos = productosRaw.map(({ _id, cantidad }) => ({ producto: _id, cantidad }));

    const pagosRaw = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicio } } },
        { $group: { _id: "$metodo_pago", total: { $sum: "$total" }, cantidad: { $sum: 1 } } },
    ]);
    const distribucionPagos = pagosRaw.map(({ _id, total, cantidad }) => ({
        metodo: _id, total, cantidad,
    }));

    // 5. Tendencia 30 Días (Pagadas vs Fiados)
    const tendenciaPlana = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: hace30dias } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$fecha" } },
            pagado: { $sum: "$monto_pagado" },
            fiado:  { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } }
        }},
        { $sort: { _id: 1 } }
    ]);
    // Formatear fechas para chart
    const tendencia30Dias = tendenciaPlana.map(t => ({
        fecha: t._id.split('-').slice(1).join('/'), // MM/DD
        pagado: t.pagado,
        fiado: t.fiado
    }));

    //  6. Lista de Recupero (Clientes Inactivos con Dispensers)
    // Obtenemos las últimas ventas por cliente
    const ultimasVentas = await Venta.aggregate([
        { $match: { businessId } },
        { $sort: { fecha: -1 } },
        { $group: { _id: "$cliente", ultimaFecha: { $first: "$fecha" } } }
    ]);
    const fechasMap = Object.fromEntries(ultimasVentas.map(u => [String(u._id), u.ultimaFecha]));

    // Filtramos de forma manual en código para cruzar bases. Buscamos clientes que TENGAN dispensers y cuya ultimaVenta sea nula o < hace20dias.
    const clientesConEquipos = await Cliente.find({ businessId, dispensersAsignados: { $gt: 0 }, activo: true }).lean();
    
    const listaRecupero = clientesConEquipos
        .map(c => {
            const uf = fechasMap[String(c._id)];
            let inactivoF = false;
            let dias = "N/A";
            if (!uf) {
                inactivoF = true; // Nunca compró pero tiene equipo
            } else if (new Date(uf) < hace20dias) {
                inactivoF = true;
                dias = Math.floor((ahora - new Date(uf)) / (1000 * 60 * 60 * 24));
            }
            return { ...c, ultimaVenta: uf, diasInactivo: dias, inactivo: inactivoF };
        })
        .filter(c => c.inactivo)
        .sort((a, b) => b.dispensersAsignados - a.dispensersAsignados)
        .slice(0, 10); // Solo los peores 10

    return {
        resumenPeriodo: {
            totalVentas:    resVentas.total   || 0,
            cantidadVentas: resVentas.cantidad || 0,
            totalCobrado:   resCobros.cobrado  || 0,
            totalGastos:    resGastos.total    || 0,
            balance:        (resCobros.cobrado || 0) - (resGastos.total || 0),
            deudaGenerada:  resDeudaGenerada.total || 0, // Fiado generado este periodo
            deudaGlobal:    resDeudaGlobal.total || 0,   // Saldo vivo total histórico
        },
        evolucion,
        productosMasVendidos,
        distribucionPagos,
        tendencia30Dias,
        listaRecupero
    };
};

// ── Resumen anual: desglose mensual por producto + ingresos ────────────────
export const getAnnualStats = async (businessId, anioParam) => {
    const anioActual = new Date().getFullYear();
    const anio = Number.isInteger(Number(anioParam)) ? Number(anioParam) : anioActual;

    // Rango del año seleccionado (usa la zona horaria del server, misma
    // convención que getDashboardStats para el corte diario/mensual).
    const inicioAnio = new Date(anio,     0, 1, 0, 0, 0, 0);
    const finAnio    = new Date(anio + 1, 0, 1, 0, 0, 0, 0);

    // 1. Catálogo dinámico de productos de la empresa
    const empresa = await Empresa.findById(businessId).select("productos").lean();
    const productosCatalogo = (empresa?.productos || []).map(p => ({
        key:   p.key,
        label: p.label,
    }));

    // 2. Cantidades vendidas por mes y por producto
    const cantidadesRaw = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicioAnio, $lt: finAnio } } },
        { $unwind: "$items" },
        { $group: {
            _id: { mes: { $month: "$fecha" }, producto: "$items.producto" },
            cantidad: { $sum: "$items.cantidad" },
        }},
    ]);

    // 3. Ingresos totales + cantidad de ventas por mes
    const ingresosRaw = await Venta.aggregate([
        { $match: { businessId, fecha: { $gte: inicioAnio, $lt: finAnio } } },
        { $group: {
            _id: { mes: { $month: "$fecha" } },
            ingresos: { $sum: "$total" },
            cantidadVentas: { $sum: 1 },
        }},
    ]);

    // 3.b Egresos (Gastos) totales por mes
    const egresosRaw = await Gasto.aggregate([
        { $match: { businessId, fecha: { $gte: inicioAnio, $lt: finAnio } } },
        { $group: {
            _id: { mes: { $month: "$fecha" } },
            egresos: { $sum: "$monto" },
        }},
    ]);

    // 4. Año de la primera venta (para armar el selector de años disponibles)
    const [primera] = await Venta.aggregate([
        { $match: { businessId } },
        { $group: { _id: null, primeraFecha: { $min: "$fecha" } } },
    ]);
    const anioInicial = primera?.primeraFecha
        ? new Date(primera.primeraFecha).getFullYear()
        : anioActual;
    const aniosDisponibles = [];
    for (let a = anioActual; a >= Math.min(anioInicial, anioActual); a--) {
        aniosDisponibles.push(a);
    }

    // 5. Armar la matriz de meses: 12 filas siempre, con 0 en meses sin ventas
    const productoKeys = productosCatalogo.map(p => p.key);

    // Mapa mes -> {producto -> cantidad}
    const cantMap = {};
    for (const row of cantidadesRaw) {
        const { mes, producto } = row._id;
        if (!cantMap[mes]) cantMap[mes] = {};
        cantMap[mes][producto] = (cantMap[mes][producto] || 0) + row.cantidad;
    }
    const ingMap = Object.fromEntries(
        ingresosRaw.map(r => [r._id.mes, { ingresos: r.ingresos, cantidadVentas: r.cantidadVentas }])
    );
    const egrMap = Object.fromEntries(
        egresosRaw.map(r => [r._id.mes, r.egresos])
    );

    const meses = Array.from({ length: 12 }, (_, i) => {
        const mesNum = i + 1;
        const productos = Object.fromEntries(productoKeys.map(k => [k, 0]));
        // Cargar cantidades por producto del catálogo
        for (const k of productoKeys) {
            productos[k] = cantMap[mesNum]?.[k] || 0;
        }
        // Sumar también productos que aparecen en ventas pero no están en el catálogo
        // (por ejemplo, productos históricos ya eliminados del catálogo).
        for (const [prodKey, cant] of Object.entries(cantMap[mesNum] || {})) {
            if (!(prodKey in productos)) productos[prodKey] = cant;
        }
        const ingresos = ingMap[mesNum]?.ingresos || 0;
        const egresos  = egrMap[mesNum]           || 0;
        return {
            mes: mesNum,
            nombre: MESES[i],
            productos,
            ingresos,
            egresos,
            neto:           ingresos - egresos,
            cantidadVentas: ingMap[mesNum]?.cantidadVentas || 0,
        };
    });

    // 6. Totales del año (agregados a partir de la matriz mensual)
    const totalesProductos = {};
    for (const m of meses) {
        for (const [k, v] of Object.entries(m.productos)) {
            totalesProductos[k] = (totalesProductos[k] || 0) + v;
        }
    }
    const totalIngresos = meses.reduce((acc, m) => acc + m.ingresos, 0);
    const totalEgresos  = meses.reduce((acc, m) => acc + m.egresos,  0);
    const totales = {
        ingresos:       totalIngresos,
        egresos:        totalEgresos,
        neto:           totalIngresos - totalEgresos,
        cantidadVentas: meses.reduce((acc, m) => acc + m.cantidadVentas, 0),
        productos:      totalesProductos,
    };

    // 7. Incluir en el catálogo los productos históricos que ya no están, para
    // que el frontend pueda renderizar todas las columnas correctamente.
    const catalogoFinal = [...productosCatalogo];
    for (const k of Object.keys(totalesProductos)) {
        if (!catalogoFinal.some(p => p.key === k)) {
            catalogoFinal.push({ key: k, label: k });
        }
    }

    return {
        anio,
        aniosDisponibles,
        productos: catalogoFinal,
        meses,
        totales,
    };
};
