import { Router }            from "express";
import { registrar, login, logout, obtenerSesionActual } from "../controllers/authController.js";
import { proteger } from "../middleware/authMiddleware.js";
import rateLimit from "express-rate-limit";
import {
    validarRegistrar,
    validarLogin
} from "../middleware/validators/authValidator.js";

const router = Router();

// Limitador Estricto para endpoints de Autenticación (Previene Ataques de Fuerza Bruta)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // Límite de 10 intentos por IP
    message: { message: "Demasiados intentos de acceso desde esta IP. Por seguridad, intente nuevamente en 15 minutos." },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post("/registrar", authLimiter, validarRegistrar, registrar);
router.post("/login",     authLimiter, validarLogin,     login);
router.post("/logout",    proteger, logout);
router.get("/me", proteger, obtenerSesionActual); // Verifica token e hidrata la página

export default router;
