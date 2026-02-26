import Gasto from "../models/Gastos.js";

// ── POST /api/gastos ───────────────────────────────────────────────────────
export const crearGasto = async (req, res) => {
    try {
        const payload = { ...req.body };
        if (payload.fecha) payload.fecha = new Date(payload.fecha);
        const nuevoGasto = await Gasto.create(payload);
        res.status(201).json(nuevoGasto);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el gasto.", error: error.message });
    }
};


// ── GET /api/gastos ────────────────────────────────────────────────────────
export const obtenerGastos = async (req, res) => {
    try {
        const gastos = await Gasto.find().sort({ fecha: -1 });
        res.status(200).json(gastos);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los gastos.", error: error.message });
    }
};

// ── GET /api/gastos/:id ────────────────────────────────────────────────────
export const obtenerGastoPorId = async (req, res) => {
    try {
        const gasto = await Gasto.findById(req.params.id);
        if (!gasto) {
            return res.status(404).json({ message: "Gasto no encontrado." });
        }
        res.status(200).json(gasto);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el gasto.", error: error.message });
    }
};

// ── PUT /api/gastos/:id ────────────────────────────────────────────────────
export const actualizarGasto = async (req, res) => {
    try {
        const gastoActualizado = await Gasto.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!gastoActualizado) {
            return res.status(404).json({ message: "Gasto no encontrado." });
        }
        res.status(200).json(gastoActualizado);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el gasto.", error: error.message });
    }
};

// ── DELETE /api/gastos/:id ─────────────────────────────────────────────────
export const eliminarGasto = async (req, res) => {
    try {
        const gastoEliminado = await Gasto.findByIdAndDelete(req.params.id);
        if (!gastoEliminado) {
            return res.status(404).json({ message: "Gasto no encontrado." });
        }
        res.status(200).json({ message: "Gasto eliminado correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el gasto.", error: error.message });
    }
};
