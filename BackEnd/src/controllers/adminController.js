import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";

// ── GET /api/admin/usuarios ────────────────────────────────────────────────
export const listarUsuarios = async (req, res) => {
    try {
        // Solo usuarios de la misma empresa del admin autenticado
        const usuarios = await Usuario.find({ businessId: req.usuario.businessId }).select("-password").sort({ createdAt: -1 });
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener usuarios.", detalle: err.message });
    }
};

// ── PATCH /api/admin/usuarios/:id/activo ──────────────────────────────────
// Alterna el campo 'activo' del usuario
export const toggleActivo = async (req, res) => {
    try {
        // Validar que el usuario pertenece a la misma empresa
        const usuario = await Usuario.findOne({ _id: req.params.id, businessId: req.usuario.businessId }).select("-password");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado en tu empresa." });

        usuario.activo = !usuario.activo;
        await usuario.save();
        res.json(usuario);
    } catch (err) {
        res.status(500).json({ message: "Error al actualizar usuario.", detalle: err.message });
    }
};

// ── DELETE /api/admin/usuarios/:id ────────────────────────────────────────
export const eliminarUsuario = async (req, res) => {
    try {
        if (String(req.params.id) === String(req.usuario._id))
            return res.status(400).json({ message: "No podes eliminar tu propia cuenta." });

        // Validar que el usuario pertenece a la misma empresa antes de eliminar
        const eliminado = await Usuario.findOneAndDelete({ _id: req.params.id, businessId: req.usuario.businessId });
        if (!eliminado) return res.status(404).json({ message: "Usuario no encontrado en tu empresa." });

        res.json({ message: "Usuario eliminado correctamente." });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar el usuario.", detalle: err.message });
    }
};

// ── GET /api/admin/empresa ─────────────────────────────────────────────────
// Devuelve el codigo de vinculacion de la empresa del admin autenticado
export const obtenerEmpresa = async (req, res) => {
    try {
        if (!req.usuario.businessId)
            return res.status(404).json({ message: "Este usuario no tiene empresa asignada." });
        const empresa = await Empresa.findById(req.usuario.businessId).select("nombre codigoVinculacion");
        if (!empresa)
            return res.status(404).json({ message: "Empresa no encontrada." });
        res.json(empresa);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener la empresa.", detalle: err.message });
    }
};
