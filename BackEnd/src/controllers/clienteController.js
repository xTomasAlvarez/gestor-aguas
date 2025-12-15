import Cliente from "../models/Cliente.js";

export const crearCliente = async (req, res) => {
    try {
        const { nombre, direccion, telefono, localidad } = req.body;

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

    } catch (err) {
        console.error("❌ Error en crearCliente:", err);
        res.status(500).json({ message: "Hubo un error en la creación del cliente" });
    }
}

export const obtenerClientes = async (req, res) => {
    try {
        const { nombre, direccion, localidad, activo } = req.query;

        // Construcción dinámica con ternarios
        nombre ? filter.nombre = { $regex: nombre, $options: "i" } : null;
        direccion ? filter.direccion = { $regex: direccion, $options: "i" } : null;
        localidad ? filter.localidad = { $regex: localidad, $options: "i" } : null;
        filter.activo = true === "false" ? false : true;

        const clientes = await Cliente
            .find(filter)
            .sort({ nombre: 1 });

        res.status(200).json(clientes);

    } catch (err) {
        console.error("❌ Error en obtenerClientes:", err);
        res.status(500).json({ message: "Error al obtener clientes", error: err.message });
    }
};

export const obtenerClienteById = (req, res) =>{
    
}