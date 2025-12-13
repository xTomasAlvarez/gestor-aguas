import Cliente from "../models/Cliente.js";

export const crearCliente = async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;

        // --- VALIDACIÓN 1: TELÉFONO REPETIDO ---
        // Solo verificamos si el campo telefono tiene contenido
        if (telefono) {
            const telefonoRepetido = await Cliente.findOne({ telefono: telefono });
            
            if (telefonoRepetido) {
                return res.status(400).json({ 
                    message: `El teléfono ${telefono} ya pertenece al cliente '${telefonoRepetido.nombre}'. Verificalo.` 
                });
            }
        }

        // --- VALIDACIÓN 2: NOMBRE + DIRECCIÓN REPETIDOS ---
        const clienteRepetido = await Cliente.findOne({ 
            nombre: nombre, 
            direccion: direccion 
        });

        if (clienteRepetido) {
            return res.status(400).json({ 
                message: `Ya existe un cliente llamado '${nombre}' en la dirección '${direccion}'` 
            });
        }

        // --- CREACIÓN ---
        const nuevoCliente = await Cliente.create(req.body);

        res.status(201).json({
            message: "Cliente creado exitosamente",
            cliente: nuevoCliente
        });

    } catch (error) {
        console.error("❌ Error en crearCliente:", error);
        res.status(500).json({ message: "Hubo un error en la creación del cliente" });
    }
}