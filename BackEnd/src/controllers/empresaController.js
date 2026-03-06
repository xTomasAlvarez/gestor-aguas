import * as EmpresaService from "../services/empresaService.js";

// ── POST /api/admin/empresa/crear ──────────────────────────────────────────
// Para admins existentes que no tienen empresa asignada todavía.
export const crearEmpresa = async (req, res) => {
    try {
        const resultado = await EmpresaService.crearEmpresa(
            req.body,
            req.usuario._id,
            req.usuario.businessId
        );
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PATCH /api/admin/empresa/regenerar-codigo ──────────────────────────────
// Genera un nuevo codigoVinculacion para la empresa del admin autenticado.
// El código anterior deja de ser válido inmediatamente.
export const regenerarCodigo = async (req, res) => {
    try {
        const resultado = await EmpresaService.regenerarCodigo(req.usuario.businessId);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
