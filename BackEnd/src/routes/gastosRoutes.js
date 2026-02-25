import { Router } from "express";
import {
    crearGasto,
    obtenerGastos,
    obtenerGastoPorId,
    actualizarGasto,
    eliminarGasto,
} from "../controllers/gastosController.js";

const router = Router();

// GET  /api/gastos      → Listar todos los gastos
// POST /api/gastos      → Crear un gasto
router.route("/")
    .get(obtenerGastos)
    .post(crearGasto);

// GET    /api/gastos/:id  → Obtener un gasto por ID
// PUT    /api/gastos/:id  → Actualizar un gasto
// DELETE /api/gastos/:id  → Eliminar un gasto
router.route("/:id")
    .get(obtenerGastoPorId)
    .put(actualizarGasto)
    .delete(eliminarGasto);

export default router;