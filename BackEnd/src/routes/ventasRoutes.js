import { Router } from "express";
import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    actualizarVenta,
    eliminarVenta,
    registrarCobranza,
    migrarFiadosLegacy
} from "../controllers/ventasController.js";
import { proteger } from "../middleware/authMiddleware.js";
import {
    validarCrearVenta,
    validarRegistrarCobranza,
    validarActualizarVenta
} from "../middleware/validators/ventasValidator.js";
import { validateObjectId } from "../middleware/validateObjectId.js";

const router = Router();
router.use(proteger);

router.route("/")
    .get(obtenerVentas)
    .post(validarCrearVenta, crearVenta);

router.post("/cobrar", validarRegistrarCobranza, registrarCobranza);

// ── Ruta temporal de migración (eliminar después de usar) ──
router.get("/migrar-fiados-legacy", migrarFiadosLegacy);

router.route("/:id")
    .get(validateObjectId, obtenerVentaPorId)
    .put(validateObjectId, validarActualizarVenta, actualizarVenta)
    .delete(validateObjectId, eliminarVenta);

export default router;
