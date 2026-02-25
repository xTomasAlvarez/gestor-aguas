import Venta   from "../models/Venta.js";
import Gasto   from "../models/Gastos.js";

const MESES = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

// Genera un array de los últimos N meses como objetos {anio, mes}
const ultimosMeses = (n = 6) => {
    const ahora = new Date();
    return Array.from({ length: n }, (_, i) => {
        const d = new Date(ahora.getFullYear(), ahora.getMonth() - (n - 1 - i), 1);
        return { anio: d.getFullYear(), mes: d.getMonth() + 1 };
    });
};

// GET /api/stats/dashboard
export const getDashboardStats = async (req, res) => {
    try {
        const ahora        = new Date();
        const inicioMes    = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
        const haceSeismeses = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

        // ── Resumen del mes actual ────────────────────────────────────────────
        const [resVentasMes = {}] = await Venta.aggregate([
            { $match: { fecha: { $gte: inicioMes }, $expr: { $gt: [{ $size: "$items" }, 0] } } },
            { $group: { _id: null, total: { $sum: "$total" }, cantidad: { $sum: 1 } } },
        ]);
        const [resCobrosMes = {}] = await Venta.aggregate([
            { $match: { fecha: { $gte: inicioMes } } },
            { $group: { _id: null, cobrado: { $sum: "$monto_pagado" } } },
        ]);
        const [resGastosMes = {}] = await Gasto.aggregate([
            { $match: { fecha: { $gte: inicioMes } } },
            { $group: { _id: null, total: { $sum: "$monto" } } },
        ]);
        // Deuda real = suma de (total - monto_pagado) de todas las ventas con ítems
        // Se usa $max para asegurar que nunca sea negativo (pagos en exceso no generan crédito negativo)
        const [resDeuda = {}] = await Venta.aggregate([
            { $match: { $expr: { $gt: [{ $size: "$items" }, 0] } } },
            { $group: {
                _id:   null,
                total: { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } },
            }},
        ]);

        // Ingresos = monto_pagado (flujo de caja real, no valor nominal)
        const ingresosPorMes = await Venta.aggregate([
            { $match: { fecha: { $gte: haceSeismeses } } },
            { $group: { _id: { anio: { $year: "$fecha" }, mes: { $month: "$fecha" } }, ingresos: { $sum: "$monto_pagado" } } },
        ]);
        const gastosPorMes = await Gasto.aggregate([
            { $match: { fecha: { $gte: haceSeismeses } } },
            { $group: { _id: { anio: { $year: "$fecha" }, mes: { $month: "$fecha" } }, gastos: { $sum: "$monto" } } },
        ]);

        // Merge en un array cronológico de 6 meses
        const ingMap  = Object.fromEntries(ingresosPorMes.map(({ _id, ingresos }) => [`${_id.anio}-${_id.mes}`, ingresos]));
        const gastMap = Object.fromEntries(gastosPorMes.map(({ _id, gastos }) => [`${_id.anio}-${_id.mes}`, gastos]));
        const evolucion = ultimosMeses(6).map(({ anio, mes }) => ({
            nombre:   MESES[mes - 1],
            ingresos: ingMap[`${anio}-${mes}`] || 0,
            gastos:   gastMap[`${anio}-${mes}`] || 0,
        }));

        // ── Productos más vendidos (histórico) ────────────────────────────────
        const productosRaw = await Venta.aggregate([
            { $unwind: "$items" },
            { $group: { _id: "$items.producto", cantidad: { $sum: "$items.cantidad" } } },
            { $sort: { cantidad: -1 } },
        ]);
        const productosMasVendidos = productosRaw.map(({ _id, cantidad }) => ({ producto: _id, cantidad }));

        // ── Distribución métodos de pago ──────────────────────────────────────
        const pagosRaw = await Venta.aggregate([
            { $group: { _id: "$metodo_pago", total: { $sum: "$total" }, cantidad: { $sum: 1 } } },
        ]);
        const distribucionPagos = pagosRaw.map(({ _id, total, cantidad }) => ({
            metodo: _id, total, cantidad,
        }));

        res.json({
            resumenMes: {
                totalVentas:    resVentasMes.total  || 0,
                cantidadVentas: resVentasMes.cantidad || 0,
                totalCobrado:   resCobrosMes.cobrado || 0,
                totalGastos:    resGastosMes.total  || 0,
                balance:        (resCobrosMes.cobrado || 0) - (resGastosMes.total || 0),
                deudaTotal:     resDeuda.total || 0,
            },
            evolucion,
            productosMasVendidos,
            distribucionPagos,
        });
    } catch (err) {
        console.error("[getDashboardStats]", err);
        res.status(500).json({ message: "Error al obtener estadísticas.", detalle: err.message });
    }
};
