import { Router } from "express";
import { obtenerConfiguracion, actualizarConfiguracion } from "../controllers/configController.js";
import { validarActualizarConfig } from "../middleware/validators/configValidator.js";

const router = Router();

// Estas rutas irradian desde /api/config pero ya estarán protegidas por los middlewares en index.js
router.get("/", obtenerConfiguracion);
router.put("/", validarActualizarConfig, actualizarConfiguracion);

export default router;
