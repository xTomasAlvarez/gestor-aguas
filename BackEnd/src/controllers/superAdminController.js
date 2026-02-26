import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";

// ── GET /api/superadmin/empresas ──────────────────────────────────────────
export const obtenerEmpresas = async (req, res) => {
    try {
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

        res.status(200).json(payload);
    } catch (error) {
        console.error("[obtenerEmpresas]", error);
        res.status(500).json({ message: "Error al obtener la lista de empresas.", detalle: error.message });
    }
};

// ── PATCH /api/superadmin/empresas/:id/suspend ────────────────────────────
export const toggleSuspenderEmpresa = async (req, res) => {
    try {
        const empresa = await Empresa.findById(req.params.id);
        if (!empresa) {
            return res.status(404).json({ message: "Empresa no encontrada." });
        }

        empresa.suspendida = !empresa.suspendida;
        await empresa.save();

        res.status(200).json({ 
            message: `Empresa ${empresa.suspendida ? 'suspendida' : 'activada'} correctamente.`,
            suspendida: empresa.suspendida
        });
    } catch (error) {
        console.error("[toggleSuspenderEmpresa]", error);
        res.status(500).json({ message: "Error al modificar la empresa.", detalle: error.message });
    }
};
