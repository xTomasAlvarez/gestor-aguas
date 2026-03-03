import * as ConfigService from "../services/configService.js";

// Helper
const biz = (req) => req.usuario?.businessId;

// ── GET /api/config ─────────────────────────────────────────────────────────
export const obtenerConfiguracion = async (req, res) => {
    try {
        const resultado = await ConfigService.obtenerConfiguracion(biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PUT /api/config ─────────────────────────────────────────────────────────
export const actualizarConfiguracion = async (req, res) => {
    try {
        const resultado = await ConfigService.actualizarConfiguracion(req.body, biz(req), req.usuario.rol);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
