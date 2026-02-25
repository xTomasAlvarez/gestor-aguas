import { Router } from "express";
import {
    crearVenta,
    obtenerVentas,
    obtenerVentaPorId,
    actualizarVenta,
    eliminarVenta,
} from "../controllers/ventasController.js";

const router = Router();

// GET  /api/ventas      → Listar todas las ventas
// POST /api/ventas      → Crear una nueva venta
router.route("/")
    .get(obtenerVentas)
    .post(crearVenta);

// GET    /api/ventas/:id  → Obtener una venta por ID
// PUT    /api/ventas/:id  → Actualizar una venta (con reversión de deuda)
// DELETE /api/ventas/:id  → Eliminar una venta (con reversión de deuda)
router.route("/:id")
    .get(obtenerVentaPorId)
    .put(actualizarVenta)
    .delete(eliminarVenta);

export default router;
