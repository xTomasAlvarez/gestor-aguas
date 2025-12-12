import { Router } from "express"

const router = Router()

// Ruta: /api/ventas

router.get("/", obtenerVentas);
router.get("/:id", obtenerVentaById);
router.post("/", crearVentas);
router.delete("/:id", eliminarVenta);
router.put("/:id", modificarVenta);

export default router

