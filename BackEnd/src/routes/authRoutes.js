import { Router }            from "express";
import { registrar, login } from "../controllers/authController.js";
import rateLimit from "express-rate-limit";

const router = Router();

// Limitador Estricto para endpoints de Autenticación (Previene Ataques de Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 5, // Límite de 5 intentos por IP
    message: { message: "Demasiados intentos de acceso desde esta IP. Por seguridad, intente nuevamente en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/registrar", authLimiter, registrar);
router.post("/login",     authLimiter, login);

export default router;
