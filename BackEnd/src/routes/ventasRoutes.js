import { Router } from "express";
import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    actualizarVenta,
    eliminarVenta,
} from "../controllers/ventasController.js";
import { proteger } from "../middleware/authMiddleware.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerVentas)
    .post(crearVenta);

router.route("/:id")
    .get(obtenerVentaPorId)
    .put(actualizarVenta)
    .delete(eliminarVenta);

export default router;
