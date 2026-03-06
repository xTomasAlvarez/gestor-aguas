import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";

// ── obtenerEmpresas ────────────────────────────────────────────────────────
export const obtenerEmpresas = async () => {
    const empresas = await Empresa.find().sort({ createdAt: -1 }).lean();
    
    // Obtener la cantidad de usuarios por cada empresa
    const conteoUsuarios = await Usuario.aggregate([
        { $match: { businessId: { $ne: null } } },
        { $group: { _id: "$businessId", count: { $sum: 1 } } }
    ]);
    
    const mapUsuarios = Object.fromEntries(
        conteoUsuarios.map(u => [String(u._id), u.count])
    );

    // Armar payload enriquecido
    const payload = empresas.map(emp => ({
        _id: emp._id,
        nombre: emp.nombre,
        codigoVinculacion: emp.codigoVinculacion,
        suspendida: emp.suspendida,
        createdAt: emp.createdAt,
        cantidadUsuarios: mapUsuarios[String(emp._id)] || 0
    }));

    return payload;
};

// ── toggleSuspenderEmpresa ─────────────────────────────────────────────────
export const toggleSuspenderEmpresa = async (empresaId) => {
    const empresa = await Empresa.findById(empresaId);
    if (!empresa) {
        const err = new Error("Empresa no encontrada.");
        err.status = 404;
        throw err;
    }

    empresa.suspendida = !empresa.suspendida;
    await empresa.save();

    return { 
        message: `Empresa ${empresa.suspendida ? 'suspendida' : 'activada'} correctamente.`,
        suspendida: empresa.suspendida
    };
};
