import * as ClienteService from "../services/clienteService.js";

// Helper: businessId del usuario autenticado (obligatorio en todas las queries)
const biz = (req) => req.usuario.businessId;

// ── GET /api/clientes/inactivos ────────────────────────────────────────────
export const obtenerInactivos = async (req, res) => {
    try {
        const resultado = await ClienteService.obtenerInactivos(biz(req), req.query);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PATCH /api/clientes/:id/estado ────────────────────────────────────────
export const toggleEstado = async (req, res) => {
    try {
        const resultado = await ClienteService.toggleEstado(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/clientes ─────────────────────────────────────────────────────
export const crearCliente = async (req, res) => {
    try {
        const resultado = await ClienteService.crearCliente(req.body, biz(req));
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/clientes ──────────────────────────────────────────────────────
export const obtenerClientes = async (req, res) => {
    try {
        const resultado = await ClienteService.obtenerClientes(biz(req), req.query);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/clientes/:id ──────────────────────────────────────────────────
export const obtenerClientePorId = async (req, res) => {
    try {
        const resultado = await ClienteService.obtenerClientePorId(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PUT /api/clientes/:id ──────────────────────────────────────────────────
export const actualizarCliente = async (req, res) => {
    try {
        const resultado = await ClienteService.actualizarCliente(req.params.id, req.body, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── DELETE /api/clientes/:id ───────────────────────────────────────────────
export const eliminarCliente = async (req, res) => {
    try {
        const resultado = await ClienteService.eliminarCliente(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};