import { Router } from "express";
import {
    crearLlenado,
    obtenerLlenados,
    obtenerLlenadoPorId,
    actualizarLlenado,
    eliminarLlenado,
} from "../controllers/llenadoController.js";
import { proteger } from "../middleware/authMiddleware.js";
import {
    validarCrearLlenado,
    validarActualizarLlenado
} from "../middleware/validators/llenadoValidator.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerLlenados)
    .post(validarCrearLlenado, crearLlenado);

router.route("/:id")
    .get(obtenerLlenadoPorId)
    .put(validarActualizarLlenado, actualizarLlenado)
    .delete(eliminarLlenado);

export default router;