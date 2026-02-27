import Venta   from "../models/Venta.js";
import Gasto   from "../models/Gastos.js";
import Cliente from "../models/Cliente.js";

const biz = (req) => req.usuario.businessId;
const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

const ultimosMeses = (n = 6) => {
    const ahora = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - (n - 1 - i), 1);
        return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
    });
};

// Helpers fechas
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

// GET /api/stats/dashboard
export const getDashboardStats = async (req, res) => {
    try {
        const businessId = biz(req);
        const { tiempo = "mes" } = req.query; // hoy, semana, mes
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

        res.json({
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
        });
    } catch (err) {
        console.error("[getDashboardStats]", err);
        res.status(500).json({ message: "Error al obtener estadísticas.", detalle: err.message });
    }
};
