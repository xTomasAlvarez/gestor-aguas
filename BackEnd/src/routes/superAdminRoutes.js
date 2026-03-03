import { Router } from "express";
import { obtenerEmpresas, toggleSuspenderEmpresa } from "../controllers/superAdminController.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

router.get("/empresas", obtenerEmpresas);
router.patch("/empresas/:id/suspend", validateObjectId, toggleSuspenderEmpresa);

export default router;
