import Usuario from "../models/Usuario.js";

// ── GET /api/admin/usuarios ────────────────────────────────────────────────
export const listarUsuarios = async (req, res) => {
    try {
        const usuarios = await Usuario.find().select("-password").sort({ createdAt: -1 });
        res.json(usuarios);
    } catch (err) {
        res.status(500).json({ message: "Error al obtener usuarios.", detalle: err.message });
    }
};

// ── PATCH /api/admin/usuarios/:id/activo ──────────────────────────────────
// Alterna el campo 'activo' del usuario
export const toggleActivo = async (req, res) => {
    try {
        const usuario = await Usuario.findById(req.params.id).select("-password");
        if (!usuario) return res.status(404).json({ message: "Usuario no encontrado." });

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
        // Protección: no se puede eliminar al propio admin logueado
        if (String(req.params.id) === String(req.usuario._id)) {
            return res.status(400).json({ message: "No puedes eliminar tu propia cuenta." });
        }
        const eliminado = await Usuario.findByIdAndDelete(req.params.id);
        if (!eliminado) return res.status(404).json({ message: "Usuario no encontrado." });
        res.json({ message: "Usuario eliminado correctamente." });
    } catch (err) {
        res.status(500).json({ message: "Error al eliminar usuario.", detalle: err.message });
    }
};
