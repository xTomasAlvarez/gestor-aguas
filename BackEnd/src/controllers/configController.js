import Empresa from "../models/Empresa.js";

// Helper
const biz = (req) => req.usuario?.businessId;

// ── GET /api/config ─────────────────────────────────────────────────────────
// Devuelve la configuración pública de la empresa del usuario logueado
export const obtenerConfiguracion = async (req, res) => {
    try {
        const businessId = biz(req);
        if (!businessId) {
            // Usuario sin empresa devuelve una config vacía por defecto
            return res.status(200).json({
                nombre: "App Reparto",
                logo: null,
                telefono: null,
                productos: []
            });
        }

        const empresa = await Empresa.findById(businessId).lean();
        if (!empresa) {
            return res.status(404).json({ message: "Empresa no encontrada." });
        }

        res.status(200).json({
            nombre:    empresa.nombre,
            logo:      empresa.logo,
            telefono:  empresa.telefono,
            productos: empresa.productos || [],
            onboardingCompletado: empresa.onboardingCompletado || false
        });

    } catch (error) {
        console.error("[obtenerConfiguracion]", error);
        res.status(500).json({ message: "Error al obtener la configuración.", detalle: error.message });
    }
};

// ── PUT /api/config ─────────────────────────────────────────────────────────
// Actualiza la configuración de la empresa (solo para administradores)
export const actualizarConfiguracion = async (req, res) => {
    try {
        if (req.usuario.rol !== "admin" && req.usuario.rol !== "superadmin") {
            return res.status(403).json({ message: "No tienes permisos de administrador." });
        }

        const businessId = biz(req);
        if (!businessId) {
            return res.status(400).json({ message: "No tienes una empresa asignada." });
        }

        // Permitimos extraer solo los campos editables de la identidad
        const { nombre, logo, telefono, productos, onboardingCompletado } = req.body;
        
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

        res.status(200).json({
            nombre:    empresaActualizada.nombre,
            logo:      empresaActualizada.logo,
            telefono:  empresaActualizada.telefono,
            productos: empresaActualizada.productos,
            onboardingCompletado: empresaActualizada.onboardingCompletado
        });

    } catch (error) {
        console.error("[actualizarConfiguracion]", error);
        res.status(500).json({ message: "Error al actualizar la configuración.", detalle: error.message });
    }
};
