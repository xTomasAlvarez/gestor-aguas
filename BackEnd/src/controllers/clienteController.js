import Cliente from "../models/Cliente.js";
import Venta   from "../models/Venta.js";

// Helper: businessId del usuario autenticado (obligatorio en todas las queries)
const biz = (req) => req.usuario.businessId;

// ── GET /api/clientes/inactivos ────────────────────────────────────────────
export const obtenerInactivos = async (req, res) => {
    try {
        const { nombre } = req.query;
        const filtro = { activo: false, businessId: biz(req) };
        if (nombre) filtro.nombre = { $regex: nombre, $options: "i" };
        const clientes = await Cliente.find(filtro).sort({ nombre: 1 }).lean();
        res.status(200).json(clientes);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener clientes inactivos.", error: error.message });
    }
};

// ── PATCH /api/clientes/:id/estado ────────────────────────────────────────
export const toggleEstado = async (req, res) => {
    try {
        const cliente = await Cliente.findOne({ _id: req.params.id, businessId: biz(req) });
        if (!cliente) return res.status(404).json({ message: "Cliente no encontrado." });
        cliente.activo = !cliente.activo;
        await cliente.save();
        res.status(200).json({ message: `Cliente ${cliente.activo ? "activado" : "desactivado"} correctamente.`, cliente });
    } catch (error) {
        res.status(500).json({ message: "Error al cambiar el estado del cliente.", error: error.message });
    }
};

// ── POST /api/clientes ─────────────────────────────────────────────────────
export const crearCliente = async (req, res) => {
    try {
        let { nombre, direccion, telefono } = req.body;
        const businessId = biz(req);

        nombre = nombre?.trim();
        direccion = direccion?.trim() || null;
        telefono = telefono?.trim() || null;

        // Anti-duplicados DENTRO de la misma empresa
        const condicionesDuplicado = [{ nombre, direccion, businessId }];
        if (telefono) condicionesDuplicado.push({ telefono, businessId });

        const clienteExistente = await Cliente.findOne({ $or: condicionesDuplicado });
        if (clienteExistente) {
            return res.status(400).json({
                message: "Ya existe un cliente con ese teléfono o con el mismo nombre y dirección.",
            });
        }

        const data = { ...req.body, nombre, direccion, telefono, businessId };
        const nuevoCliente = await Cliente.create(data);
        res.status(201).json(nuevoCliente);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Teléfono o dirección duplicados en la base de datos." });
        }
        res.status(500).json({ message: "Error al crear el cliente.", error: error.message });
    }
};

// ── GET /api/clientes ──────────────────────────────────────────────────────
export const obtenerClientes = async (req, res) => {
    try {
        const { nombre } = req.query;
        const businessId = biz(req);

        // Saldo pendiente — solo ventas de esta empresa
        const saldosPorCliente = await Venta.aggregate([
            { $match: { businessId, $expr: { $gt: [{ $size: "$items" }, 0] } } },
            { $group: {
                _id:            "$cliente",
                saldo_pendiente: { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } },
            }},
        ]);
        const saldoMap = Object.fromEntries(
            saldosPorCliente.map(({ _id, saldo_pendiente }) => [String(_id), saldo_pendiente])
        );

        const filtro = { activo: true, businessId };
        if (nombre) filtro.nombre = { $regex: nombre, $options: "i" };

        const clientes = await Cliente.find(filtro).sort({ nombre: 1 }).lean();
        const clientesConSaldo = clientes.map((c) => ({
            ...c,
            saldo_pendiente: saldoMap[String(c._id)] || 0,
        }));

        res.status(200).json(clientesConSaldo);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener los clientes.", error: error.message });
    }
};

// ── GET /api/clientes/:id ──────────────────────────────────────────────────
export const obtenerClientePorId = async (req, res) => {
    try {
        const cliente = await Cliente.findOne({ _id: req.params.id, businessId: biz(req) });
        if (!cliente) return res.status(404).json({ message: "Cliente no encontrado." });
        res.status(200).json(cliente);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener el cliente.", error: error.message });
    }
};

// ── PUT /api/clientes/:id ──────────────────────────────────────────────────
export const actualizarCliente = async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.direccion !== undefined) data.direccion = data.direccion?.trim() || null;
        if (data.telefono !== undefined) data.telefono = data.telefono?.trim() || null;
        if (data.nombre !== undefined) data.nombre = data.nombre?.trim();

        const clienteActualizado = await Cliente.findOneAndUpdate(
            { _id: req.params.id, businessId: biz(req) },
            data,
            { new: true, runValidators: true }
        );
        if (!clienteActualizado) return res.status(404).json({ message: "Cliente no encontrado." });
        res.status(200).json(clienteActualizado);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: "Teléfono o dirección duplicados en la base de datos." });
        }
        res.status(500).json({ message: "Error al actualizar el cliente.", error: error.message });
    }
};

// ── DELETE /api/clientes/:id ───────────────────────────────────────────────
// Soft-delete: cambia 'activo' a false
export const eliminarCliente = async (req, res) => {
    try {
        const clienteDesactivado = await Cliente.findOneAndUpdate(
            { _id: req.params.id, businessId: biz(req) },
            { activo: false },
            { new: true }
        );
        if (!clienteDesactivado) return res.status(404).json({ message: "Cliente no encontrado." });
        res.status(200).json({ message: "Cliente desactivado correctamente.", cliente: clienteDesactivado });
    } catch (error) {
        res.status(500).json({ message: "Error al desactivar el cliente.", error: error.message });
    }
};