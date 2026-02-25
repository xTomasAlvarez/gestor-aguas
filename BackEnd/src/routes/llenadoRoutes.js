import { Router } from "express";
import {
    crearLlenado,
    obtenerLlenados,
    obtenerLlenadoPorId,
    actualizarLlenado,
    eliminarLlenado,
} from "../controllers/llenadoController.js";

const router = Router();

// GET  /api/llenados      → Listar todos los llenados
// POST /api/llenados      → Registrar un llenado
router.route("/")
    .get(obtenerLlenados)
    .post(crearLlenado);

// GET    /api/llenados/:id  → Obtener un llenado por ID
// PUT    /api/llenados/:id  → Actualizar un llenado
// DELETE /api/llenados/:id  → Eliminar un llenado
router.route("/:id")
    .get(obtenerLlenadoPorId)
    .put(actualizarLlenado)
    .delete(eliminarLlenado);

export default router;