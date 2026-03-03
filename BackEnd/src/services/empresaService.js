import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";

// ── crearEmpresa ───────────────────────────────────────────────────────────
export const crearEmpresa = async (body, usuarioId, businessId) => {
    if (businessId) {
        const err = new Error("Ya tenés una empresa asignada.");
        err.status = 400;
        throw err;
    }

    const { nombre } = body;
    if (!nombre?.trim()) {
        const err = new Error("El nombre de la empresa es obligatorio.");
        err.status = 400;
        throw err;
    }

    const empresa = await Empresa.create({ nombre: nombre.trim() });

    // Vincular al usuario admin con la nueva empresa
    await Usuario.findByIdAndUpdate(usuarioId, { businessId: empresa._id });

    return { nombre: empresa.nombre, codigoVinculacion: empresa.codigoVinculacion };
};

// ── regenerarCodigo ────────────────────────────────────────────────────────
export const regenerarCodigo = async (businessId) => {
    if (!businessId) {
        const err = new Error("No tenés una empresa asignada.");
        err.status = 404;
        throw err;
    }

    const empresa = await Empresa.findById(businessId);
    if (!empresa) {
        const err = new Error("Empresa no encontrada.");
        err.status = 404;
        throw err;
    }

    // Generar un código nuevo único (reintenta si colisiona)
    let nuevo;
    let intentos = 0;
    do {
        // Asumiendo que Empresa.generarCodigo() es un estático del esquema
        nuevo = Empresa.generarCodigo();
        intentos++;
    } while (
        (await Empresa.exists({ codigoVinculacion: nuevo, _id: { $ne: empresa._id } })) &&
        intentos < 10
    );

    empresa.codigoVinculacion = nuevo;
    await empresa.save();

    return { codigoVinculacion: empresa.codigoVinculacion, nombre: empresa.nombre };
};
