import Cliente from "../models/Cliente.js";
import Venta   from "../models/Venta.js";

// ── obtenerInactivos ───────────────────────────────────────────────────────
export const obtenerInactivos = async (businessId, query) => {
    const { nombre } = query;
    const filtro = { activo: false, businessId };
    if (nombre) filtro.nombre = { $regex: nombre, $options: "i" };
    return await Cliente.find(filtro).sort({ nombre: 1 }).lean();
};

// ── toggleEstado ───────────────────────────────────────────────────────────
export const toggleEstado = async (clienteId, businessId) => {
    const cliente = await Cliente.findOne({ _id: clienteId, businessId });
    if (!cliente) {
        const err = new Error("Cliente no encontrado.");
        err.status = 404;
        throw err;
    }
    cliente.activo = !cliente.activo;
    await cliente.save();
    return {
        message: `Cliente ${cliente.activo ? "activado" : "desactivado"} correctamente.`,
        cliente,
    };
};

// ── crearCliente ───────────────────────────────────────────────────────────
export const crearCliente = async (body, businessId) => {
    let { nombre, direccion, telefono } = body;

    nombre    = nombre?.trim();
    direccion = direccion?.trim() || null;
    telefono  = telefono?.trim() || null;

    // Anti-duplicados DENTRO de la misma empresa
    const condicionesDuplicado = [{ nombre, direccion, businessId }];
    if (telefono) condicionesDuplicado.push({ telefono, businessId });

    const clienteExistente = await Cliente.findOne({ $or: condicionesDuplicado });
    if (clienteExistente) {
        const err = new Error("Ya existe un cliente con ese teléfono o con el mismo nombre y dirección.");
        err.status = 400;
        throw err;
    }

    try {
        const data = { ...body, nombre, direccion, telefono, businessId };
        return await Cliente.create(data);
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error("Teléfono o dirección duplicados en la base de datos.");
            err.status = 400;
            throw err;
        }
        throw error;
    }
};

// ── obtenerClientes ────────────────────────────────────────────────────────
export const obtenerClientes = async (businessId, query) => {
    const { nombre } = query;

    // Saldo pendiente — solo ventas de esta empresa
    const saldosPorCliente = await Venta.aggregate([
        { $match: { businessId, $expr: { $gt: [{ $size: "$items" }, 0] } } },
        { $group: {
            _id:             "$cliente",
            saldo_pendiente: { $sum: { $max: [0, { $subtract: ["$total", "$monto_pagado"] }] } },
        }},
    ]);
    const saldoMap = Object.fromEntries(
        saldosPorCliente.map(({ _id, saldo_pendiente }) => [String(_id), saldo_pendiente])
    );

    const filtro = { activo: true, businessId };
    if (nombre) filtro.nombre = { $regex: nombre, $options: "i" };

    const clientes = await Cliente.find(filtro).sort({ nombre: 1 }).lean();
    return clientes.map((c) => ({
        ...c,
        saldo_pendiente: saldoMap[String(c._id)] || 0,
    }));
};

// ── obtenerClientePorId ────────────────────────────────────────────────────
export const obtenerClientePorId = async (clienteId, businessId) => {
    const cliente = await Cliente.findOne({ _id: clienteId, businessId });
    if (!cliente) {
        const err = new Error("Cliente no encontrado.");
        err.status = 404;
        throw err;
    }
    return cliente;
};

// ── actualizarCliente ──────────────────────────────────────────────────────
export const actualizarCliente = async (clienteId, body, businessId) => {
    const data = { ...body };
    if (data.direccion !== undefined) data.direccion = data.direccion?.trim() || null;
    if (data.telefono  !== undefined) data.telefono  = data.telefono?.trim()  || null;
    if (data.nombre    !== undefined) data.nombre    = data.nombre?.trim();

    try {
        const clienteActualizado = await Cliente.findOneAndUpdate(
            { _id: clienteId, businessId },
            data,
            { new: true, runValidators: true }
        );
        if (!clienteActualizado) {
            const err = new Error("Cliente no encontrado.");
            err.status = 404;
            throw err;
        }
        return clienteActualizado;
    } catch (error) {
        if (error.code === 11000) {
            const err = new Error("Teléfono o dirección duplicados en la base de datos.");
            err.status = 400;
            throw err;
        }
        throw error;
    }
};

// ── eliminarCliente ────────────────────────────────────────────────────────
// Soft-delete: cambia 'activo' a false
export const eliminarCliente = async (clienteId, businessId) => {
    const clienteDesactivado = await Cliente.findOneAndUpdate(
        { _id: clienteId, businessId },
        { activo: false },
        { new: true }
    );
    if (!clienteDesactivado) {
        const err = new Error("Cliente no encontrado.");
        err.status = 404;
        throw err;
    }
    return { message: "Cliente desactivado correctamente.", cliente: clienteDesactivado };
};
