import Cliente from "../models/Cliente.js";

// ── POST /api/clientes ─────────────────────────────────────────────────────
// Regla: Bloquear si ya existe el mismo teléfono o la misma combinación nombre+dirección
export const crearCliente = async (req, res) => {
    try {
        const { nombre, direccion, telefono } = req.body;

        // Construimos la query de búsqueda de duplicados
        const condicionesDuplicado = [{ nombre, direccion }];
        if (telefono) condicionesDuplicado.push({ telefono });

        const clienteExistente = await Cliente.findOne({
            $or: condicionesDuplicado,
        });

        if (clienteExistente) {
            return res.status(400).json({
                message: "Ya existe un cliente con ese teléfono o con la misma combinación de nombre y dirección.",
            });
        }

        const nuevoCliente = await Cliente.create(req.body);
        res.status(201).json(nuevoCliente);
    } catch (error) {
        res.status(500).json({ message: "Error al crear el cliente.", error: error.message });
    }
};

// ── GET /api/clientes ──────────────────────────────────────────────────────
// Regla: Siempre filtrar por { activo: true }. Permite ?nombre= para buscar por nombre (regex)
export const obtenerClientes = async (req, res) => {
    try {
        const { nombre } = req.query;
        const filtro = { activo: true };

        if (nombre) {
            filtro.nombre = { $regex: nombre, $options: "i" }; // Case-insensitive
        }

        const clientes = await Cliente.find(filtro).sort({ nombre: 1 });
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los clientes.", error: error.message });
    }
};

// ── GET /api/clientes/:id ──────────────────────────────────────────────────
export const obtenerClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findById(req.params.id);

        if (!cliente) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el cliente.", error: error.message });
    }
};

// ── PUT /api/clientes/:id ──────────────────────────────────────────────────
export const actualizarCliente = async (req, res) => {
    try {
        const clienteActualizado = await Cliente.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!clienteActualizado) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.status(200).json(clienteActualizado);
    } catch (error) {
        res.status(500).json({ message: "Error al actualizar el cliente.", error: error.message });
    }
};

// ── DELETE /api/clientes/:id ───────────────────────────────────────────────
// Regla SOFT DELETE: cambia 'activo' a false en lugar de eliminar el documento
export const eliminarCliente = async (req, res) => {
    try {
        const clienteDesactivado = await Cliente.findByIdAndUpdate(
            req.params.id,
            { activo: false },
            { new: true }
        );

        if (!clienteDesactivado) {
            return res.status(404).json({ message: "Cliente no encontrado." });
        }

        res.status(200).json({
            message: "Cliente desactivado correctamente.",
            cliente: clienteDesactivado,
        });
    } catch (error) {
        res.status(500).json({ message: "Error al desactivar el cliente.", error: error.message });
    }
};