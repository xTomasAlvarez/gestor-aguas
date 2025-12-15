import Venta from "../models/Venta.js";
import Cliente from "../models/Cliente.js";
import { calcularImpactoDeuda } from "../helpers/calcularImpactoDeuda.js";

// =====================================================================
// CONTROLADORES
// =====================================================================

// POST: Crear una nueva venta
export const crearVenta = async (req, res) => {
    try {
        const data = req.body;

        // 1. Guardamos la venta en BD
        // Usamos .create() que instancia y guarda en un solo paso
        const nuevaVenta = await Venta.create(data);

        // 2. LÓGICA DE NEGOCIO: SI ES FIADO, ACTUALIZAR CUENTA CORRIENTE
        if (data.metodo_pago === "fiado") {
            
            // Usamos la función auxiliar para obtener los totales limpios
            const totales = calcularImpactoDeuda(data.items);

            // Actualización Atómica ($inc): Asegura que si llegan 2 ventas a la vez, se sumen bien.
            await Cliente.findByIdAndUpdate(data.cliente, {
                $inc: { 
                    'deuda.bidones_20L': totales.bidones_20L,
                    'deuda.bidones_12L': totales.bidones_12L,
                    'deuda.sodas': totales.sodas
                }
            });
        }

        // HTTP 201: Created (Recurso creado exitosamente)
        res.status(201).json(nuevaVenta);

    } catch (err) {
        console.err("❌ err en crearVenta:", err);
        res.status(500).json({ message: "err interno al procesar la venta", err: err.message });
    }
};

// GET: Obtener historial de ventas con filtros
import Venta from "../models/Venta.js";

export const obtenerVentas = async (req, res) => {
    try {
        const { fecha, metodo_pago, cliente } = req.query;
        const filter = {};

        // Filtros dinámicos con ternarios
        metodo_pago ? filter.metodo_pago = metodo_pago : null;
        cliente ? filter.cliente = cliente : null; // Aquí 'cliente' se espera que sea el ID
        fecha ? filter.fecha = fecha : null;

        const ventas = await Venta.find(filter)
            .populate({ path: "cliente", select: "nombre" })
            .sort({ createdAt: -1 });

        res.status(200).json(ventas);

    } catch (err) {
        console.error("❌ Error en obtenerVentas:", err);
        res.status(500).json({ message: "Error al obtener ventas", error: err.message });
    }
};

// GET: Obtener una venta por ID
export const obtenerVentaById = async (req, res) => {
    try {
        const { id } = req.params;
        const venta = await Venta.findById(id).populate({ path: "cliente", select: "nombre" });
        
        // Validación temprana: Si no existe, cortamos la ejecución aquí
        if (!venta) {
            return res.status(404).json({ message: "La venta solicitada no existe" });
        }

        res.status(200).json(venta);

    } catch (err) {
        console.err("❌ err en obtenerVentaById:", err);
        res.status(500).json({ message: "err al obtener la venta", err: err.message });
    }
};

// DELETE: Eliminar venta y revertir deuda si corresponde
export const eliminarVenta = async (req, res) => {
    try {
        const { id } = req.params;

        // 1. Buscamos la venta antes de borrarla (Necesitamos saber qué tenía)
        const venta = await Venta.findById(id);

        if (!venta) {
            return res.status(404).json({ message: "No se puede eliminar: Venta no encontrada" });
        }

        // 2. REVERSIÓN DE DEUDA (Rollback)
        if (venta.metodo_pago === 'fiado') {
            const totales = calcularImpactoDeuda(venta.items);

            // Restamos usando los valores calculados en negativo
            await Cliente.findByIdAndUpdate(venta.cliente, {
                $inc: {
                    'deuda.bidones_20L': -totales.bidones_20L,
                    'deuda.bidones_12L': -totales.bidones_12L,
                    'deuda.sodas': -totales.sodas
                }
            });
        }

        // 3. Eliminación física
        await Venta.findByIdAndDelete(id);

        res.status(200).json({ message: "Venta eliminada y saldos ajustados correctamente" });

    } catch (err) {
        console.err("❌ err en eliminarVenta:", err);
        res.status(500).json({ message: "err crítico al eliminar venta", err: err.message });
    }
};

// PUT: Modificar venta 
export const modificarVenta = async (req, res) => {
    const { id } = req.params;
    const { items, total, metodo_pago, cliente } = req.body; 

    try {
        // 1. Obtener estado ANTERIOR de la venta
        const ventaAnterior = await Venta.findById(id);
        if (!ventaAnterior) return res.status(404).json({ message: "Venta no encontrada" });

        // =======================================================
        // FASE 1: DESHACER EL PASADO (Rollback venta vieja)
        // =======================================================
        if (ventaAnterior.metodo_pago === 'fiado') {
            const totalesViejos = calcularImpactoDeuda(ventaAnterior.items);
            
            // Restamos la deuda que generó la venta vieja
            await Cliente.findByIdAndUpdate(ventaAnterior.cliente, {
                $inc: {
                    'deuda.bidones_20L': -totalesViejos.bidones_20L,
                    'deuda.bidones_12L': -totalesViejos.bidones_12L,
                    'deuda.sodas': -totalesViejos.sodas
                }
            });
        }

        // =======================================================
        // FASE 2: ACTUALIZAR EL PRESENTE (Guardar cambios)
        // =======================================================
        ventaAnterior.items = items;
        ventaAnterior.total = total;
        ventaAnterior.metodo_pago = metodo_pago;
        ventaAnterior.cliente = cliente; 

        const ventaActualizada = await ventaAnterior.save();

        // =======================================================
        // FASE 3: APLICAR EL FUTURO (Impactar venta nueva)
        // =======================================================
        if (metodo_pago === 'fiado') {
            const totalesNuevos = calcularImpactoDeuda(items);

            // Sumamos la deuda de la versión editada
            await Cliente.findByIdAndUpdate(cliente, {
                $inc: {
                    'deuda.bidones_20L': totalesNuevos.bidones_20L,
                    'deuda.bidones_12L': totalesNuevos.bidones_12L,
                    'deuda.sodas': totalesNuevos.sodas
                }
            });
        }

        res.status(200).json(ventaActualizada);

    } catch (err) {
        console.err("❌ err en modificarVenta:", err);
        res.status(500).json({ message: "err al modificar la venta", err: err.message });
    }
};