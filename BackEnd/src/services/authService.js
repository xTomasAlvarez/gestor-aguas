import jwt     from "jsonwebtoken";
import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";

// ── Helpers privados ───────────────────────────────────────────────────────

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

// ── registrar ──────────────────────────────────────────────────────────────
//
// CASO A — Unirse a empresa (empleado):
//   { nombre, email, password, inviteCode }
//   Busca la empresa por codigoVinculacion y vincula al usuario como empleado.
//
// CASO B — Crear empresa (admin):
//   { nombre, email, password, nombreEmpresa, masterCode }
//   Verifica MASTER_ADMIN_CODE y crea una empresa nueva.
//
export const registrar = async (body) => {
    const { nombre, email, password, inviteCode, nombreEmpresa, masterCode } = body;

    if (!nombre || !email || !password) {
        const err = new Error("Nombre, email y contraseña son obligatorios.");
        err.status = 400;
        throw err;
    }

    const existe = await Usuario.findOne({ email });
    if (existe) {
        const err = new Error("El email ya está registrado.");
        err.status = 400;
        throw err;
    }

    // ── CASO A: unirse a una empresa como empleado ─────────────────────────
    if (inviteCode) {
        const empresa = await Empresa.findOne({
            codigoVinculacion: inviteCode.trim().toUpperCase(),
        });
        if (!empresa) {
            const err = new Error("Código de empresa inválido. Verificá el código con tu administrador.");
            err.status = 400;
            throw err;
        }

        const usuario = await Usuario.create({
            nombre, email, password,
            rol:        "empleado",
            activo:     false,        // requiere aprobación del admin
            businessId: empresa._id,
        });

        return {
            message: "Cuenta creada. Aguarda la aprobación del administrador para poder ingresar.",
            usuario: usuarioSeguro(usuario),
        };
    }

    // ── CASO B: crear empresa nueva como admin ─────────────────────────────
    if (!masterCode || masterCode !== process.env.MASTER_ADMIN_CODE) {
        const err = new Error("No tienes autorización para crear una empresa.");
        err.status = 403;
        throw err;
    }

    const empresa = await Empresa.create({
        nombre: nombreEmpresa?.trim() || `Empresa de ${nombre}`,
    });

    const usuario = await Usuario.create({
        nombre, email, password,
        rol:        "admin",
        activo:     true,             // el admin queda activo de inmediato
        businessId: empresa._id,
    });

    return {
        message: `Empresa "${empresa.nombre}" creada. Ya podés iniciar sesión.`,
        codigoVinculacion: empresa.codigoVinculacion,
        usuario: usuarioSeguro(usuario),
    };
};

// ── login ──────────────────────────────────────────────────────────────────
export const login = async (body) => {
    const { email, password } = body;

    if (!email || !password) {
        const err = new Error("Email y contraseña son obligatorios.");
        err.status = 400;
        throw err;
    }

    const usuario = await Usuario.findOne({ email });
    if (!usuario) {
        const err = new Error("Credenciales incorrectas.");
        err.status = 401;
        throw err;
    }

    const ok = await usuario.compararPassword(password);
    if (!ok) {
        const err = new Error("Credenciales incorrectas.");
        err.status = 401;
        throw err;
    }

    if (!usuario.activo) {
        const err = new Error("Tu cuenta aún no fue aprobada. Contacta al administrador.");
        err.status = 403;
        throw err;
    }

    return { token: generarToken(usuario._id), usuario: usuarioSeguro(usuario) };
};

// ── obtenerSesionActual ────────────────────────────────────────────────────
// Valida que el usuario del JWT siga existiendo y activo en la DB.
export const obtenerSesionActual = async (usuarioId) => {
    const usuarioValido = await Usuario.findById(usuarioId);

    if (!usuarioValido || !usuarioValido.activo) {
        const err = new Error("Usuario inválido o desactivado.");
        err.status = 401;
        throw err;
    }

    return { usuario: usuarioSeguro(usuarioValido) };
};
