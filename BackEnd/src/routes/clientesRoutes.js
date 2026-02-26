import { Router } from "express";
import {
    crearCliente,
    obtenerClientes,
    obtenerInactivos,
    obtenerClientePorId,
    actualizarCliente,
    eliminarCliente,
    toggleEstado,
} from "../controllers/clienteController.js";
import { proteger } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger); // todas las rutas requieren JWT

router.get("/inactivos", obtenerInactivos); // ANTES de /:id para que no colisione

router.route("/")
    .get(obtenerClientes)
    .post(crearCliente);

router.patch("/:id/estado", toggleEstado);

router.route("/:id")
    .get(obtenerClientePorId)
    .put(actualizarCliente)
    .delete(eliminarCliente);

export default router;