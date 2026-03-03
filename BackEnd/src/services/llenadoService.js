import Llenado from "../models/Llenado.js";
import Gasto   from "../models/Gastos.js";

// ── crearLlenado ───────────────────────────────────────────────────────────
export const crearLlenado = async (body, businessId) => {
    const payload = { ...body, businessId };
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

    return nuevoLlenado;
};

// ── obtenerLlenados ────────────────────────────────────────────────────────
export const obtenerLlenados = async (businessId) => {
    return await Llenado.find({ businessId }).sort({ fecha: -1 });
};

// ── obtenerLlenadoPorId ────────────────────────────────────────────────────
export const obtenerLlenadoPorId = async (llenadoId, businessId) => {
    const llenado = await Llenado.findOne({ _id: llenadoId, businessId });
    if (!llenado) {
        const err = new Error("Llenado no encontrado.");
        err.status = 404;
        throw err;
    }
    return llenado;
};

// ── actualizarLlenado ──────────────────────────────────────────────────────
export const actualizarLlenado = async (llenadoId, body, businessId) => {
    const llenadoOriginal = await Llenado.findOne({ _id: llenadoId, businessId });
    if (!llenadoOriginal) {
        const err = new Error("Llenado no encontrado.");
        err.status = 404;
        throw err;
    }

    const nuevoCosto = body.costo_total;
    let   gastoRef   = llenadoOriginal.gasto_ref;

    if (gastoRef) {
        if (nuevoCosto > 0) {
            await Gasto.findByIdAndUpdate(gastoRef, {
                monto: nuevoCosto,
                fecha: body.fecha || llenadoOriginal.fecha,
            });
        } else {
            await Gasto.findByIdAndDelete(gastoRef);
            gastoRef = null;
        }
    } else if (nuevoCosto > 0) {
        const nuevoGasto = await Gasto.create({
            concepto:   "Llenado",
            monto:      nuevoCosto,
            fecha:      body.fecha || llenadoOriginal.fecha,
            businessId,
        });
        gastoRef = nuevoGasto._id;
    }

    const llenadoActualizado = await Llenado.findByIdAndUpdate(
        llenadoId,
        { ...body, gasto_ref: gastoRef },
        { new: true, runValidators: true }
    );

    return llenadoActualizado;
};

// ── eliminarLlenado ────────────────────────────────────────────────────────
export const eliminarLlenado = async (llenadoId, businessId) => {
    const llenado = await Llenado.findOne({ _id: llenadoId, businessId });
    if (!llenado) {
        const err = new Error("Llenado no encontrado.");
        err.status = 404;
        throw err;
    }

    if (llenado.gasto_ref) {
        await Gasto.findByIdAndDelete(llenado.gasto_ref);
    }

    await Llenado.findByIdAndDelete(llenadoId);
    return { message: "Llenado y gasto asociado eliminados correctamente." };
};
