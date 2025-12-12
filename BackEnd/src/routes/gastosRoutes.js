import { Router } from "express"

const router = Router()

// Ruta: /api/Gasto

router.get("/", obtenerGastos);
router.get("/:id", obtenerGastoById);
router.post("/", crearGasto);
router.delete("/:id", eliminarGasto);
router.put("/:id", modificarGasto);

export default router