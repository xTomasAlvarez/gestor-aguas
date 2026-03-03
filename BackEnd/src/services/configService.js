import Empresa from "../models/Empresa.js";

// ── obtenerConfiguracion ───────────────────────────────────────────────────
export const obtenerConfiguracion = async (businessId) => {
    if (!businessId) {
        // Usuario sin empresa devuelve una config vacía por defecto
        return {
            nombre: "H2APP",
            logo: null,
            telefono: null,
            productos: []
        };
    }

    const empresa = await Empresa.findById(businessId).lean();
    if (!empresa) {
        const err = new Error("Empresa no encontrada.");
        err.status = 404;
        throw err;
    }

    return {
        nombre:    empresa.nombre,
        logo:      empresa.logo,
        telefono:  empresa.telefono,
        productos: empresa.productos || [],
        onboardingCompletado: empresa.onboardingCompletado || false
    };
};

// ── actualizarConfiguracion ────────────────────────────────────────────────
export const actualizarConfiguracion = async (body, businessId) => {
    if (!businessId) {
        const err = new Error("No tienes una empresa asignada.");
        err.status = 400;
        throw err;
    }

    // Permitimos extraer solo los campos editables de la identidad
    const { nombre, logo, telefono, productos, onboardingCompletado } = body;
    
    const payload = {};
    if (nombre !== undefined) payload.nombre = nombre;
    if (logo !== undefined) payload.logo = logo;
    if (telefono !== undefined) payload.telefono = telefono;
    if (productos !== undefined) payload.productos = productos;
    if (onboardingCompletado !== undefined) payload.onboardingCompletado = onboardingCompletado;

    const empresaActualizada = await Empresa.findByIdAndUpdate(
        businessId,
        { $set: payload },
        { new: true, runValidators: true }
    ).lean();

    return {
        nombre:    empresaActualizada.nombre,
        logo:      empresaActualizada.logo,
        telefono:  empresaActualizada.telefono,
        productos: empresaActualizada.productos,
        onboardingCompletado: empresaActualizada.onboardingCompletado
    };
};
