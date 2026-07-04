import { Router } from "express";
import { obtenerEmpresas, toggleSuspenderEmpresa } from "../controllers/superAdminController.js";
import { validateObjectId } from "../middleware/validateObjectId.js";
import { proteger } from "../middleware/authMiddleware.js";
import { soloSuperAdmin } from "../middleware/superAdminMiddleware.js";

const router = Router();

router.get("/empresas", proteger, soloSuperAdmin, obtenerEmpresas);
router.patch("/empresas/:id/suspend", proteger, soloSuperAdmin, validateObjectId, toggleSuspenderEmpresa);

export default router;
