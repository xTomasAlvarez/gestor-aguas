import * as LlenadoService from "../services/llenadoService.js";

const biz = (req) => req.usuario.businessId;

// ── POST /api/llenados ─────────────────────────────────────────────────────
export const crearLlenado = async (req, res) => {
    try {
        const resultado = await LlenadoService.crearLlenado(req.body, biz(req));
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/llenados ──────────────────────────────────────────────────────
export const obtenerLlenados = async (req, res) => {
    try {
        const resultado = await LlenadoService.obtenerLlenados(biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/llenados/:id ──────────────────────────────────────────────────
export const obtenerLlenadoPorId = async (req, res) => {
    try {
        const resultado = await LlenadoService.obtenerLlenadoPorId(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PUT /api/llenados/:id ──────────────────────────────────────────────────
export const actualizarLlenado = async (req, res) => {
    try {
        const resultado = await LlenadoService.actualizarLlenado(req.params.id, req.body, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── DELETE /api/llenados/:id ───────────────────────────────────────────────
export const eliminarLlenado = async (req, res) => {
    try {
        const resultado = await LlenadoService.eliminarLlenado(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
