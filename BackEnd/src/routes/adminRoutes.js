import { Router } from "express";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";
import { listarUsuarios, toggleActivo, eliminarUsuario, obtenerEmpresa } from "../controllers/adminController.js";
import { regenerarCodigo, crearEmpresa } from "../controllers/empresaController.js";

const router = Router();

// Todas las rutas requieren estar autenticado y ser admin
router.use(proteger, soloAdmin);

router.get("/usuarios",                listarUsuarios);
router.patch("/usuarios/:id/activo",   toggleActivo);
router.delete("/usuarios/:id",         eliminarUsuario);
router.get("/empresa",                          obtenerEmpresa);
router.post("/empresa/crear",                   crearEmpresa);
router.patch("/empresa/regenerar-codigo",       regenerarCodigo);

export default router;

