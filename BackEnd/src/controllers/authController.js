import jwt      from "jsonwebtoken";
import Usuario  from "../models/Usuario.js";
import Empresa  from "../models/Empresa.js";

const generarToken = (id) =>
    jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "12h" });

// Solo expone campos seguros al frontend
const usuarioSeguro = (u) => ({
    _id:        u._id,
    nombre:     u.nombre,
    email:      u.email,
    rol:        u.rol,
    activo:     u.activo,
    businessId: u.businessId ?? null,
});

// ── POST /api/auth/registrar ───────────────────────────────────────────────
//
// CASO A — Unirse a empresa (empleado):
//   { nombre, email, password, inviteCode }
//   Busca la empresa por codigoVinculacion y vincula al usuario como empleado.
//
// CASO B — Crear empresa (admin):
//   { nombre, email, password, nombreEmpresa, masterCode }
//   Verifica MASTER_ADMIN_CODE y crea una empresa nueva.
//
export const registrar = async (req, res) => {
    try {
        const { nombre, email, password, inviteCode, nombreEmpresa, masterCode } = req.body;

        if (!nombre || !email || !password)
            return res.status(400).json({ message: "Nombre, email y contraseña son obligatorios." });

        const existe = await Usuario.findOne({ email });
        if (existe) return res.status(400).json({ message: "El email ya está registrado." });

        // ── CASO A: unirse a una empresa como empleado ─────────────────────
        if (inviteCode) {
            const empresa = await Empresa.findOne({
                codigoVinculacion: inviteCode.trim().toUpperCase(),
            });
            if (!empresa)
                return res.status(400).json({ message: "Código de empresa inválido. Verificá el código con tu administrador." });

            const usuario = await Usuario.create({
                nombre, email, password,
                rol:        "empleado",
                activo:     false,        // requiere aprobación del admin
                businessId: empresa._id,
            });

            return res.status(201).json({
                message: "Cuenta creada. Aguarda la aprobación del administrador para poder ingresar.",
                usuario:  usuarioSeguro(usuario),
            });
        }

        // ── CASO B: crear empresa nueva como admin ─────────────────────────
        if (!masterCode || masterCode !== process.env.MASTER_ADMIN_CODE)
            return res.status(403).json({ message: "No tienes autorización para crear una empresa." });

        const empresa = await Empresa.create({
            nombre: nombreEmpresa?.trim() || `Empresa de ${nombre}`,
        });

        const usuario = await Usuario.create({
            nombre, email, password,
            rol:        "admin",
            activo:     true,             // el admin queda activo de inmediato
            businessId: empresa._id,
        });

        return res.status(201).json({
            message: `Empresa "${empresa.nombre}" creada. Sesión iniciada automáticamente.`,
            token: generarToken(usuario._id),
            codigoVinculacion: empresa.codigoVinculacion,
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
            return res.status(400).json({ message: "Email y contraseña son obligatorios." });

        const usuario = await Usuario.findOne({ email });
        if (!usuario) return res.status(401).json({ message: "Credenciales incorrectas." });

        const ok = await usuario.compararPassword(password);
        if (!ok) return res.status(401).json({ message: "Credenciales incorrectas." });

        if (!usuario.activo) {
            return res.status(403).json({
                message: "Tu cuenta aún no fue aprobada. Contacta al administrador.",
            });
        }

        res.json({ token: generarToken(usuario._id), usuario: usuarioSeguro(usuario) });
    } catch (err) {
        console.error("[login]", err);
        res.status(500).json({ message: "Error al iniciar sesión.", detalle: err.message });
    }
};
