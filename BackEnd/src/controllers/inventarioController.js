import * as InventarioService from "../services/inventarioService.js";

const biz = (req) => req.usuario.businessId;

// ── GET /api/inventario/dashboard ──────────────────────────────────────────
export const obtenerDashboard = async (req, res) => {
    try {
        const resultado = await InventarioService.obtenerDashboard(biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PATCH /api/inventario ──────────────────────────────────────────────────
export const actualizarInventario = async (req, res) => {
    try {
        const resultado = await InventarioService.actualizarInventario(req.body, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
