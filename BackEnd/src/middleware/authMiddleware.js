import jwt     from "jsonwebtoken";
import Usuario from "../models/Usuario.js";

/**
 * Middleware de autenticación por JWT.
 * Agrega req.usuario con los datos del usuario autenticado.
 */
export const proteger = async (req, res, next) => {
    try {
        const auth = req.headers.authorization;
        if (!auth?.startsWith("Bearer "))
            return res.status(401).json({ message: "No autorizado. Token requerido." });

        const token   = auth.split(" ")[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        req.usuario = await Usuario.findById(decoded.id).select("-password");
        if (!req.usuario)
            return res.status(401).json({ message: "Usuario no encontrado." });

        next();
    } catch {
        res.status(401).json({ message: "Token inválido o expirado." });
    }
};
