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

// GET /api/stats/annual?anio=YYYY
export const getAnnualStats = async (req, res) => {
    try {
        const resultado = await StatsService.getAnnualStats(
            req.usuario.businessId,
            req.query.anio
        );
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
