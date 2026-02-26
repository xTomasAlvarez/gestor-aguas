/**
 * Middleware de autorización: solo usuarios con rol 'superadmin'.
 * Debe usarse DESPUÉS de proteger.
 */
export const soloSuperAdmin = (req, res, next) => {
    if (req.usuario?.rol !== "superadmin") {
        return res.status(403).json({ message: "Acceso denegado. Se requiere nivel de Super Administrador." });
    }
    next();
};
