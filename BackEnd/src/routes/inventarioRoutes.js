import { Router } from "express";
import { obtenerDashboard, actualizarInventario } from "../controllers/inventarioController.js";
import { validarActualizarInventario } from "../middleware/validators/inventarioValidator.js";

const router = Router();

router.get("/dashboard", obtenerDashboard);
router.patch("/", validarActualizarInventario, actualizarInventario);

export default router;
