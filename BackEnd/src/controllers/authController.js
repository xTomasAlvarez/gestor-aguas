import jwt      from "jsonwebtoken";
import Usuario  from "../models/Usuario.js";

const generarToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "12h" });

// Solo expone campos seguros al frontend
const usuarioSeguro = (u) => ({
    _id: u._id, nombre: u.nombre, email: u.email, rol: u.rol, activo: u.activo,
});

// ── POST /api/auth/registrar ───────────────────────────────────────────────
export const registrar = async (req, res) => {
    try {
        const { nombre, email, password, registrationKey } = req.body;

        // Validar clave de invitación
        if (!registrationKey || registrationKey !== process.env.REGISTRATION_KEY) {
            return res.status(401).json({ message: "Codigo de invitacion invalido." });
        }

        if (!nombre || !email || !password)
            return res.status(400).json({ message: "Nombre, email y contrasena son obligatorios." });

        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ message: "El email ya esta registrado." });

        // El rol siempre es 'empleado' y activo: false hasta que el admin apruebe
        const usuario = await Usuario.create({ nombre, email, password }); // rol y activo usan defaults
        res.status(201).json({
            message: "Cuenta creada. Aguarda la aprobacion del administrador para poder ingresar.",
            usuario: usuarioSeguro(usuario),
        });
    } catch (err) {
        console.error("[registrar]", err);
        res.status(500).json({ message: "Error al registrar usuario.", detalle: err.message });
    }
};

// ── POST /api/auth/login ───────────────────────────────────────────────────
export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email y contrasena son obligatorios." });

        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(401).json({ message: "Credenciales incorrectas." });

        const ok = await usuario.compararPassword(password);
        if (!ok) return res.status(401).json({ message: "Credenciales incorrectas." });

        // Bloquear cuentas inactivas
        if (!usuario.activo) {
            return res.status(403).json({
                message: "Tu cuenta aun no fue aprobada. Contacta al administrador.",
            });
        }

        res.json({ token: generarToken(usuario._id), usuario: usuarioSeguro(usuario) });
    } catch (err) {
        console.error("[login]", err);
        res.status(500).json({ message: "Error al iniciar sesion.", detalle: err.message });
    }
};
