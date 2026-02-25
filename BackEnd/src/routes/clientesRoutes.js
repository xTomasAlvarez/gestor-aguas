import { Router } from "express";
import {
    crearCliente,
    obtenerClientes,
    obtenerClientePorId,
    actualizarCliente,
    eliminarCliente,
} from "../controllers/clienteController.js";
import { proteger } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger); // todas las rutas requieren JWT

router.route("/")
    .get(obtenerClientes)
    .post(crearCliente);

router.route("/:id")
    .get(obtenerClientePorId)
    .put(actualizarCliente)
    .delete(eliminarCliente);

export default router;