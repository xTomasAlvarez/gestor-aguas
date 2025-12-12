import { Router } from "express"

const router = Router()

// Ruta: /api/Cliente

router.get("/", obtenerClientes);
router.get("/:id", obtenerClienteById);
router.post("/", crearCliente);
router.delete("/:id", eliminarCliente);
router.put("/:id", modificarCliente);

export default router