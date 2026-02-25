import Llenado from "../models/Llenado.js";

// ── POST /api/llenados ─────────────────────────────────────────────────────
export const crearLlenado = async (req, res) => {
    try {
        const nuevoLlenado = await Llenado.create(req.body);
        res.status(201).json(nuevoLlenado);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el llenado.", error: error.message });
    }
};

// ── GET /api/llenados ──────────────────────────────────────────────────────
export const obtenerLlenados = async (req, res) => {
    try {
        const llenados = await Llenado.find().sort({ fecha: -1 });
        res.status(200).json(llenados);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los llenados.", error: error.message });
    }
};

// ── GET /api/llenados/:id ──────────────────────────────────────────────────
export const obtenerLlenadoPorId = async (req, res) => {
    try {
        const llenado = await Llenado.findById(req.params.id);
        if (!llenado) {
            return res.status(404).json({ message: "Llenado no encontrado." });
        }
        res.status(200).json(llenado);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el llenado.", error: error.message });
    }
};

// ── PUT /api/llenados/:id ──────────────────────────────────────────────────
export const actualizarLlenado = async (req, res) => {
    try {
        const llenadoActualizado = await Llenado.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );
        if (!llenadoActualizado) {
            return res.status(404).json({ message: "Llenado no encontrado." });
        }
        res.status(200).json(llenadoActualizado);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el llenado.", error: error.message });
    }
};

// ── DELETE /api/llenados/:id ───────────────────────────────────────────────
export const eliminarLlenado = async (req, res) => {
    try {
        const llenadoEliminado = await Llenado.findByIdAndDelete(req.params.id);
        if (!llenadoEliminado) {
            return res.status(404).json({ message: "Llenado no encontrado." });
        }
        res.status(200).json({ message: "Llenado eliminado correctamente." });
    } catch (error) {
        res.status(500).json({ message: "Error al eliminar el llenado.", error: error.message });
    }
};
