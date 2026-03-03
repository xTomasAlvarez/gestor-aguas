import * as GastosService from "../services/gastosService.js";

const biz = (req) => req.usuario.businessId;

// ── POST /api/gastos ───────────────────────────────────────────────────────
export const crearGasto = async (req, res) => {
    try {
        const resultado = await GastosService.crearGasto(req.body, biz(req));
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/gastos ────────────────────────────────────────────────────────
export const obtenerGastos = async (req, res) => {
    try {
        const resultado = await GastosService.obtenerGastos(biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/gastos/:id ────────────────────────────────────────────────────
export const obtenerGastoPorId = async (req, res) => {
    try {
        const resultado = await GastosService.obtenerGastoPorId(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PUT /api/gastos/:id ────────────────────────────────────────────────────
export const actualizarGasto = async (req, res) => {
    try {
        const resultado = await GastosService.actualizarGasto(req.params.id, req.body, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── DELETE /api/gastos/:id ─────────────────────────────────────────────────
export const eliminarGasto = async (req, res) => {
    try {
        const resultado = await GastosService.eliminarGasto(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
