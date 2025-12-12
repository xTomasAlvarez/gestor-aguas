import { Router } from "express"

const router = Router()

// Ruta: /api/llenado

router.get("/", obtenerLlenados);
router.get("/:id", obtenerLlenadoById);
router.post("/", crearLLenado);
router.delete("/:id", eliminarLlenado);
router.put("/:id", modificarLlenado);

export default router