import { Router } from "express";
import {
    crearGasto,
    obtenerGastos,
    obtenerGastoPorId,
    actualizarGasto,
    eliminarGasto,
} from "../controllers/gastosController.js";
import { proteger } from "../middleware/authMiddleware.js";
import {
    validarCrearGasto,
    validarActualizarGasto
} from "../middleware/validators/gastosValidator.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerGastos)
    .post(validarCrearGasto, crearGasto);

router.route("/:id")
    .get(obtenerGastoPorId)
    .put(validarActualizarGasto, actualizarGasto)
    .delete(eliminarGasto);

export default router;