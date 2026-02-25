import { Router } from "express";
import {
    crearGasto,
    obtenerGastos,
    obtenerGastoPorId,
    actualizarGasto,
    eliminarGasto,
} from "../controllers/gastosController.js";
import { proteger } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerGastos)
    .post(crearGasto);

router.route("/:id")
    .get(obtenerGastoPorId)
    .put(actualizarGasto)
    .delete(eliminarGasto);

export default router;