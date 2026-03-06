import Gasto from "../models/Gastos.js";

// ── crearGasto ─────────────────────────────────────────────────────────────
export const crearGasto = async (body, businessId) => {
    const payload = { ...body, businessId };
    if (payload.fecha) payload.fecha = new Date(payload.fecha);
    
    return await Gasto.create(payload);
};

// ── obtenerGastos ──────────────────────────────────────────────────────────
export const obtenerGastos = async (businessId) => {
    return await Gasto.find({ businessId }).sort({ fecha: -1 });
};

// ── obtenerGastoPorId ──────────────────────────────────────────────────────
export const obtenerGastoPorId = async (gastoId, businessId) => {
    const gasto = await Gasto.findOne({ _id: gastoId, businessId });
    if (!gasto) {
        const err = new Error("Gasto no encontrado.");
        err.status = 404;
        throw err;
    }
    return gasto;
};

// ── actualizarGasto ────────────────────────────────────────────────────────
export const actualizarGasto = async (gastoId, body, businessId) => {
    const gastoActualizado = await Gasto.findOneAndUpdate(
        { _id: gastoId, businessId },
        body,
        { new: true, runValidators: true }
    );
    
    if (!gastoActualizado) {
        const err = new Error("Gasto no encontrado.");
        err.status = 404;
        throw err;
    }
    
    return gastoActualizado;
};

// ── eliminarGasto ──────────────────────────────────────────────────────────
export const eliminarGasto = async (gastoId, businessId) => {
    const gastoEliminado = await Gasto.findOneAndDelete({ _id: gastoId, businessId });
    
    if (!gastoEliminado) {
        const err = new Error("Gasto no encontrado.");
        err.status = 404;
        throw err;
    }
    
    return { message: "Gasto eliminado correctamente." };
};
