import Empresa from "../models/Empresa.js";

/**
 * Middleware: verifica que la empresa del usuario no esté suspendida.
 * Debe aplicarse DESPUÉS de `proteger` (necesita req.usuario.businessId).
 * Si la empresa está suspendida devuelve 403 con un mensaje identificable.
 */
export const checkStatus = async (req, res, next) => {
    try {
        // Usuarios sin empresa asignada pasan (ej: cuenta legacy sin businessId)
        if (!req.usuario?.businessId) return next();

        const empresa = await Empresa.findById(req.usuario.businessId).select("suspendida").lean();

        if (empresa?.suspendida) {
            return res.status(403).json({
                code:    "EMPRESA_SUSPENDIDA",
                message: "Esta instancia ha sido suspendida. Contacte al administrador del sistema.",
            });
        }

        next();
    } catch (err) {
        console.error("[checkStatus]", err);
        next(); // ante error inesperado, no bloquear
    }
};
