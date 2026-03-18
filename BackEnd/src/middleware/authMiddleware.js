import jwt     from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

/**
 * Middleware de autenticación por JWT.
 * Agrega req.usuario con los datos del usuario autenticado (fresh desde BD).
 */
export const proteger = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "No autorizado. Token requerido." });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = await Usuario.findById(decoded.id).select("-password");
        if (!req.usuario) {
            return res.status(401).json({ message: "Usuario no encontrado." });
        }

        next();
    } catch (error) {
        // Si hay un error (token inválido, expirado, etc.), limpiamos la cookie
        if (req.cookies.token) {
            res.cookie("token", "", {
                httpOnly: true,
                expires: new Date(0),
                path: "/",
            });
        }
        res.status(401).json({ message: "Token inválido o expirado." });
    }
};

/**
 * Middleware de autorización: solo usuarios con rol 'admin'.
 * Debe usarse DESPUÉS de proteger.
 */
export const soloAdmin = (req, res, next) => {
    if (req.usuario?.rol !== "admin") {
        return res.status(403).json({ message: "Acceso restringido a administradores." });
    }
    next();
};

