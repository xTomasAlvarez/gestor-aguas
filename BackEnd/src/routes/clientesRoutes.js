import { Router } from "express";
import {
    crearCliente,
    obtenerClientes,
    obtenerClientePorId,
    actualizarCliente,
    eliminarCliente,
} from "../controllers/clienteController.js";

const router = Router();

// GET  /api/clientes          → Listar todos los clientes activos (con filtro ?nombre=)
// POST /api/clientes          → Crear un nuevo cliente
router.route("/")
    .get(obtenerClientes)
    .post(crearCliente);

// GET    /api/clientes/:id    → Obtener un cliente por ID
// PUT    /api/clientes/:id    → Actualizar datos de un cliente
// DELETE /api/clientes/:id    → Desactivar un cliente (soft delete)
router.route("/:id")
    .get(obtenerClientePorId)
    .put(actualizarCliente)
    .delete(eliminarCliente);

export default router;