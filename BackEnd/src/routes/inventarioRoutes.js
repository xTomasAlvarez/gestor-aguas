import { Router } from "express";
import { obtenerDashboard, actualizarInventario } from "../controllers/inventarioController.js";

const router = Router();

router.get("/dashboard", obtenerDashboard);
router.patch("/", actualizarInventario);

export default router;
