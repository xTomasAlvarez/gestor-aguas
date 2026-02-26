import { Router } from "express";
import { obtenerEmpresas, toggleSuspenderEmpresa } from "../controllers/superAdminController.js";

const router = Router();

router.get("/empresas", obtenerEmpresas);
router.patch("/empresas/:id/suspend", toggleSuspenderEmpresa);

export default router;
