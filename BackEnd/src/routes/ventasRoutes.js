import { Router } from "express"
import {obtenerVentas, obtenerVentaById, crearVenta, eliminarVenta, modificarVenta} from "../controllers/ventasController.js"

const router = Router()

// Ruta: /api/ventas

router.get("/", obtenerVentas);
router.get("/:id", obtenerVentaById);
router.post("/", crearVenta);
router.delete("/:id", eliminarVenta);
router.put("/:id", modificarVenta);

export default router

