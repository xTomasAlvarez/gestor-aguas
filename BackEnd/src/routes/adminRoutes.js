import { Router } from "express";
import { proteger, soloAdmin } from "../middleware/authMiddleware.js";
import { listarUsuarios, toggleActivo, eliminarUsuario, obtenerEmpresa, migrarCobranzasViejas } from "../controllers/adminController.js";
import { regenerarCodigo, crearEmpresa } from "../controllers/empresaController.js";
import { validarCrearEmpresa } from "../middleware/validators/adminValidator.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();

// Todas las rutas requieren estar autenticado y ser admin
router.use(proteger, soloAdmin);

router.get("/usuarios",                listarUsuarios);
router.patch("/usuarios/:id/activo",   validateObjectId, toggleActivo);
router.delete("/usuarios/:id",         validateObjectId, eliminarUsuario);
router.get("/empresa",                          obtenerEmpresa);
router.get("/migrar-cobranzas-viejas",          migrarCobranzasViejas);
router.post("/empresa/crear", validarCrearEmpresa, crearEmpresa);
router.patch("/empresa/regenerar-codigo",       regenerarCodigo);

export default router;

