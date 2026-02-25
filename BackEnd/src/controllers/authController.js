import jwt      from "jsonwebtoken";
import Usuario  from "../models/Usuario.js";

const generarToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const usuarioSeguro = (u) => ({
    _id: u._id, nombre: u.nombre, email: u.email, rol: u.rol,
});

// POST /api/auth/registrar
export const registrar = async (req, res) => {
    try {
        const { nombre, email, password, rol } = req.body;
        if (!nombre || !email || !password)
            return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios." });

        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ message: "El email ya está registrado." });

        const usuario = await Usuario.create({ nombre, email, password, rol });
        res.status(201).json({ token: generarToken(usuario._id), usuario: usuarioSeguro(usuario) });
    } catch (err) {
        console.error("[registrar]", err);
        res.status(500).json({ message: "Error al registrar usuario.", detalle: err.message });
    }
};

// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email y contraseña son obligatorios." });

        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(401).json({ message: "Credenciales incorrectas." });

        const ok = await usuario.compararPassword(password);
        if (!ok) return res.status(401).json({ message: "Credenciales incorrectas." });

        res.json({ token: generarToken(usuario._id), usuario: usuarioSeguro(usuario) });
    } catch (err) {
        console.error("[login]", err);
        res.status(500).json({ message: "Error al iniciar sesión.", detalle: err.message });
    }
};
