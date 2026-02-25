import Venta from "../models/Venta.js";
import Cliente from "../models/Cliente.js";

// ── Helper: construye el objeto $inc para la deuda del cliente ─────────────
// Mapea cada item de la venta al campo correspondiente en deuda.*
const construirIncDeuda = (items, multiplicador = 1) => {
    const inc = {};
    for (const item of items) {
        if (item.producto === "Bidon 20L") {
            inc["deuda.bidones_20L"] = (inc["deuda.bidones_20L"] || 0) + item.cantidad * multiplicador;
        } else if (item.producto === "Bidon 12L") {
            inc["deuda.bidones_12L"] = (inc["deuda.bidones_12L"] || 0) + item.cantidad * multiplicador;
        } else if (item.producto === "Soda") {
            inc["deuda.sodas"] = (inc["deuda.sodas"] || 0) + item.cantidad * multiplicador;
        }
    }
    return inc;
};

// ── POST /api/ventas ───────────────────────────────────────────────────────
// Regla: Si metodo_pago === 'fiado', suma la deuda al cliente con $inc
export const crearVenta = async (req, res) => {
    try {
        const { metodo_pago, items, cliente: clienteId } = req.body;

        if (metodo_pago === "fiado") {
            const incDeuda = construirIncDeuda(items, 1);
            await Cliente.findByIdAndUpdate(clienteId, { $inc: incDeuda });
        }

        const nuevaVenta = await Venta.create(req.body);
        res.status(201).json(nuevaVenta);
    } catch (error) {
        res.status(500).json({ message: "Error al crear la venta.", error: error.message });
    }
};

// ── GET /api/ventas ────────────────────────────────────────────────────────
export const obtenerVentas = async (req, res) => {
    try {
        const ventas = await Venta.find()
            .populate("cliente", "nombre direccion")
            .sort({ fecha: -1 });

        res.status(200).json(ventas);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las ventas.", error: error.message });
    }
};

// ── GET /api/ventas/:id ────────────────────────────────────────────────────
export const obtenerVentaPorId = async (req, res) => {
    try {
        const venta = await Venta.findById(req.params.id)
            .populate("cliente", "nombre direccion");

        if (!venta) {
            return res.status(404).json({ message: "Venta no encontrada." });
        }

        res.status(200).json(venta);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la venta.", error: error.message });
    }
};

// ── PUT /api/ventas/:id ────────────────────────────────────────────────────
// Regla VIAJE EN EL TIEMPO:
//   1. Si la venta ORIGINAL era 'fiado' → revertir la deuda previa (multiplicador -1)
//   2. Si la venta NUEVA     es  'fiado' → sumar la deuda nueva   (multiplicador +1)
export const actualizarVenta = async (req, res) => {
    try {
        // Paso 1: Buscar la venta original
        const ventaOriginal = await Venta.findById(req.params.id);
        if (!ventaOriginal) {
            return res.status(404).json({ message: "Venta no encontrada." });
        }

        // Paso 2: Revertir deuda si la venta original era 'fiado'
        if (ventaOriginal.metodo_pago === "fiado") {
            const incReversion = construirIncDeuda(ventaOriginal.items, -1);
            await Cliente.findByIdAndUpdate(ventaOriginal.cliente, { $inc: incReversion });
        }

        // Paso 3: Aplicar nueva deuda si la venta actualizada es 'fiado'
        const { metodo_pago: nuevoMetodo, items: nuevosItems, cliente: nuevoClienteId } = req.body;
        if (nuevoMetodo === "fiado") {
            const incNueva = construirIncDeuda(nuevosItems, 1);
            // Si el cliente cambió, aplicar sobre el nuevo; si no, sobre el original
            const clienteTarget = nuevoClienteId || ventaOriginal.cliente;
            await Cliente.findByIdAndUpdate(clienteTarget, { $inc: incNueva });
        }

        // Paso 4: Guardar la venta actualizada
        const ventaActualizada = await Venta.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        res.status(200).json(ventaActualizada);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar la venta.", error: error.message });
    }
};

// ── DELETE /api/ventas/:id ─────────────────────────────────────────────────
// Regla: Si la venta era 'fiado', revertir la deuda con $inc antes de borrar
export const eliminarVenta = async (req, res) => {
    try {
        const venta = await Venta.findById(req.params.id);
        if (!venta) {
            return res.status(404).json({ message: "Venta no encontrada." });
        }

        // Revertir deuda si corresponde
        if (venta.metodo_pago === "fiado") {
            const incReversion = construirIncDeuda(venta.items, -1);
            await Cliente.findByIdAndUpdate(venta.cliente, { $inc: incReversion });
        }

        // Eliminar físicamente la venta
        await Venta.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: "Venta eliminada y deuda revertida correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar la venta.", error: error.message });
    }
};