import Llenado from "../models/Llenado.js";
import Gasto   from "../models/Gastos.js";

const biz = (req) => req.usuario.businessId;

// ── POST /api/llenados ─────────────────────────────────────────────────────
export const crearLlenado = async (req, res) => {
    try {
        const businessId = biz(req);
        const payload = { ...req.body, businessId };
        if (payload.fecha) payload.fecha = new Date(payload.fecha);

        const nuevoLlenado = await Llenado.create(payload);

        // Auto-gasto: si tiene costo, crear un gasto paralelo con la misma fecha
        if (nuevoLlenado.costo_total > 0) {
            const gasto = await Gasto.create({
                concepto:   "Llenado",
                monto:      nuevoLlenado.costo_total,
                fecha:      nuevoLlenado.fecha,
                businessId,
            });
            nuevoLlenado.gasto_ref = gasto._id;
            await nuevoLlenado.save();
        }

        res.status(201).json(nuevoLlenado);
    } catch (error) {
        console.error("[crearLlenado]", error);
        res.status(500).json({ message: "Error al crear el llenado.", error: error.message });
    }
};

// ── GET /api/llenados ──────────────────────────────────────────────────────
export const obtenerLlenados = async (req, res) => {
    try {
        const llenados = await Llenado.find({ businessId: biz(req) }).sort({ fecha: -1 });
        res.status(200).json(llenados);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los llenados.", error: error.message });
    }
};

// ── GET /api/llenados/:id ──────────────────────────────────────────────────
export const obtenerLlenadoPorId = async (req, res) => {
    try {
        const llenado = await Llenado.findOne({ _id: req.params.id, businessId: biz(req) });
        if (!llenado) return res.status(404).json({ message: "Llenado no encontrado." });
        res.status(200).json(llenado);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el llenado.", error: error.message });
    }
};

// ── PUT /api/llenados/:id ──────────────────────────────────────────────────
export const actualizarLlenado = async (req, res) => {
    try {
        const businessId = biz(req);
        const llenadoOriginal = await Llenado.findOne({ _id: req.params.id, businessId });
        if (!llenadoOriginal) return res.status(404).json({ message: "Llenado no encontrado." });

        const nuevoCosto = req.body.costo_total;
        let   gastoRef   = llenadoOriginal.gasto_ref;

        if (gastoRef) {
            if (nuevoCosto > 0) {
                await Gasto.findByIdAndUpdate(gastoRef, {
                    monto: nuevoCosto,
                    fecha: req.body.fecha || llenadoOriginal.fecha,
                });
            } else {
                await Gasto.findByIdAndDelete(gastoRef);
                gastoRef = null;
            }
        } else if (nuevoCosto > 0) {
            const nuevoGasto = await Gasto.create({
                concepto:   "Llenado",
                monto:      nuevoCosto,
                fecha:      req.body.fecha || llenadoOriginal.fecha,
                businessId,
            });
            gastoRef = nuevoGasto._id;
        }

        const llenadoActualizado = await Llenado.findByIdAndUpdate(
            req.params.id,
            { ...req.body, gasto_ref: gastoRef },
            { new: true, runValidators: true }
        );

        res.status(200).json(llenadoActualizado);
    } catch (error) {
        console.error("[actualizarLlenado]", error);
        res.status(500).json({ message: "Error al actualizar el llenado.", error: error.message });
    }
};

// ── DELETE /api/llenados/:id ───────────────────────────────────────────────
export const eliminarLlenado = async (req, res) => {
    try {
        const llenado = await Llenado.findOne({ _id: req.params.id, businessId: biz(req) });
        if (!llenado) return res.status(404).json({ message: "Llenado no encontrado." });

        if (llenado.gasto_ref) {
            await Gasto.findByIdAndDelete(llenado.gasto_ref);
        }

        await Llenado.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Llenado y gasto asociado eliminados correctamente." });
    } catch (error) {
        console.error("[eliminarLlenado]", error);
        res.status(500).json({ message: "Error al eliminar el llenado.", error: error.message });
    }
};
