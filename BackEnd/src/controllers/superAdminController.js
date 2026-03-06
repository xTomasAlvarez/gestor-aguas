import * as SuperAdminService from "../services/superAdminService.js";

// ── GET /api/superadmin/empresas ──────────────────────────────────────────
export const obtenerEmpresas = async (req, res) => {
    try {
        const resultado = await SuperAdminService.obtenerEmpresas();
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PATCH /api/superadmin/empresas/:id/suspend ────────────────────────────
export const toggleSuspenderEmpresa = async (req, res) => {
    try {
        const resultado = await SuperAdminService.toggleSuspenderEmpresa(req.params.id);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
