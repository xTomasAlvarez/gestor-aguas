import { Router } from "express";
import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    actualizarVenta,
    eliminarVenta,
    registrarCobranza
} from "../controllers/ventasController.js";
import { proteger } from "../middleware/authMiddleware.js";
import {
    validarCrearVenta,
    validarRegistrarCobranza,
    validarActualizarVenta
} from "../middleware/validators/ventasValidator.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerVentas)
    .post(validarCrearVenta, crearVenta);

router.post("/cobrar", validarRegistrarCobranza, registrarCobranza);

router.route("/:id")
    .get(obtenerVentaPorId)
    .put(validarActualizarVenta, actualizarVenta)
    .delete(eliminarVenta);

export default router;
