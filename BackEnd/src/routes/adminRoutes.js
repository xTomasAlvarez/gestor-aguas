import { Router } from "express";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";
import { listarUsuarios, toggleActivo, eliminarUsuario } from "../controllers/adminController.js";

const router = Router();

// Todas las rutas requieren estar autenticado y ser admin
router.use(proteger, soloAdmin);

router.get("/usuarios",                listarUsuarios);
router.patch("/usuarios/:id/activo",   toggleActivo);
router.delete("/usuarios/:id",         eliminarUsuario);

export default router;
