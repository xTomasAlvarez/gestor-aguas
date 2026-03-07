import * as AdminService from "../services/adminService.js";

// ── GET /api/admin/usuarios ────────────────────────────────────────────────
export const listarUsuarios = async (req, res) => {
    try {
        const resultado = await AdminService.listarUsuarios(req.usuario.businessId);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PATCH /api/admin/usuarios/:id/activo ──────────────────────────────────
export const toggleActivo = async (req, res) => {
    try {
        const resultado = await AdminService.toggleActivo(req.params.id, req.usuario.businessId);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── DELETE /api/admin/usuarios/:id ────────────────────────────────────────
export const eliminarUsuario = async (req, res) => {
    try {
        const resultado = await AdminService.eliminarUsuario(
            req.params.id,
            req.usuario.businessId,
            req.usuario._id
        );
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/admin/empresa ─────────────────────────────────────────────────
export const obtenerEmpresa = async (req, res) => {
    try {
        const resultado = await AdminService.obtenerEmpresa(req.usuario.businessId);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/admin/migrar-cobranzas-viejas ─────────────────────────────────
export const migrarCobranzasViejas = async (req, res) => {
    try {
        const resultado = await AdminService.migrarCobranzasViejas(req.usuario.businessId);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
