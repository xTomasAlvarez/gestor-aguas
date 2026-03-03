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
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerLlenados)
    .post(validarCrearLlenado, crearLlenado);

router.route("/:id")
    .get(validateObjectId, obtenerLlenadoPorId)
    .put(validateObjectId, validarActualizarLlenado, actualizarLlenado)
    .delete(validateObjectId, eliminarLlenado);

export default router;