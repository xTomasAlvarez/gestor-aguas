import * as AuthService from "../services/authService.js";

// ── POST /api/auth/registrar ───────────────────────────────────────────────
export const registrar = async (req, res) => {
    try {
        const resultado = await AuthService.registrar(req.body);
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const resultado = await AuthService.login(req.body);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/auth/me ───────────────────────────────────────────────────────
// Endpoint de validación de sesión. El AuthContext de React lo consume
// tras cada F5 o entrada en crudo para verificar que el JWT es válido.
export const obtenerSesionActual = async (req, res) => {
    try {
        const resultado = await AuthService.obtenerSesionActual(req.usuario._id);
        res.json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};
