import * as StatsService from "../services/statsService.js";

// GET /api/stats/dashboard
export const getDashboardStats = async (req, res) => {
    try {
        const resultado = await StatsService.getDashboardStats(
            req.usuario.businessId,
            req.query.tiempo
        );
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
