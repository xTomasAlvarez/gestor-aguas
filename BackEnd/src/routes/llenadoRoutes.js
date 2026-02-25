import { Router } from "express";
import {
    crearLlenado,
    obtenerLlenados,
    obtenerLlenadoPorId,
    actualizarLlenado,
    eliminarLlenado,
} from "../controllers/llenadoController.js";
import { proteger } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerLlenados)
    .post(crearLlenado);

router.route("/:id")
    .get(obtenerLlenadoPorId)
    .put(actualizarLlenado)
    .delete(eliminarLlenado);

export default router;