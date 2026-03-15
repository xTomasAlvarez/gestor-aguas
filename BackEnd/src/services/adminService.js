import Usuario from "../models/Usuario.js";
import Empresa from "../models/Empresa.js";
import Venta from "../models/Venta.js";
import Cobranza from "../models/Cobranza.js";

// ── listarUsuarios ─────────────────────────────────────────────────────────
// Devuelve todos los usuarios de la empresa, sin exponer la contraseña.
export const listarUsuarios = async (businessId) => {
    return await Usuario.find({ businessId }).select("-password").sort({ createdAt: -1 });
};

// ── toggleActivo ───────────────────────────────────────────────────────────
// Alterna el campo 'activo' del usuario validando que pertenezca a la empresa.
export const toggleActivo = async (usuarioId, businessId) => {
    const usuario = await Usuario.findOne({ _id: usuarioId, businessId }).select("-password");
    if (!usuario) {
        const err = new Error("Usuario no encontrado en tu empresa.");
        err.status = 404;
        throw err;
    }

    usuario.activo = !usuario.activo;
    await usuario.save();
    return usuario;
};

// ── eliminarUsuario ────────────────────────────────────────────────────────
// Elimina un usuario validando que no se elimine a sí mismo y que pertenezca
// a la misma empresa del admin.
export const eliminarUsuario = async (usuarioId, businessId, adminId) => {
    if (String(usuarioId) === String(adminId)) {
        const err = new Error("No podes eliminar tu propia cuenta.");
        err.status = 400;
        throw err;
    }

    const eliminado = await Usuario.findOneAndDelete({ _id: usuarioId, businessId });
    if (!eliminado) {
        const err = new Error("Usuario no encontrado en tu empresa.");
        err.status = 404;
        throw err;
    }

    return { message: "Usuario eliminado correctamente." };
};

// ── obtenerEmpresa ─────────────────────────────────────────────────────────
// Devuelve nombre y codigoVinculacion de la empresa del admin autenticado.
export const obtenerEmpresa = async (businessId) => {
    if (!businessId) {
        const err = new Error("Este usuario no tiene empresa asignada.");
        err.status = 404;
        throw err;
    }

    const empresa = await Empresa.findById(businessId).select("nombre codigoVinculacion");
    if (!empresa) {
        const err = new Error("Empresa no encontrada.");
        err.status = 404;
        throw err;
    }

    return empresa;
};

// ── migrarCobranzasViejas (One-off Script) ───────────────────────────────
// Busca ventas saldadas o parcialmente pagadas sin Cobranza y las crea.
export const migrarCobranzasViejas = async (businessId) => {
    // Buscar todas las ventas que tengan algún abono (monto_pagado > 0 o total abonado en status)
    // Para mitigar, agarramos todas las ventas del tenant que tengan monto_pagado > 0 o estado 'saldado'.
    const ventas = await Venta.find({ 
        businessId, 
        $or: [
            { estado: "saldado" },
            { monto_pagado: { $gt: 0 } }
        ] 
    });

    let creadas = 0;
    
    for (const venta of ventas) {
        // Verificar si la venta tiene un pago real registrado
        const pagoReal = venta.monto_pagado || 0;
        
        // Si el estado es saldado, aseguramos que el monto sea igual al total
        const montoACobrar = (venta.estado === "saldado" && pagoReal === 0) ? venta.total : pagoReal;
        
        if (montoACobrar <= 0) continue; // Evitar crear cobranzas de $0

        // Verificar si YA existe una Cobranza vinculada a esta Venta
        const existeCobranza = await Cobranza.findOne({ venta: venta._id, businessId });
        
        if (!existeCobranza) {
            const metodoValido = ["efectivo", "transferencia"].includes(venta.metodo_pago) ? venta.metodo_pago : "efectivo";
            await Cobranza.create({
                venta: venta._id,
                cliente: venta.cliente,
                monto: montoACobrar,
                metodoPago: metodoValido,
                fecha: venta.updatedAt || venta.fecha || new Date(),
                businessId
            });
            creadas++;
        }
    }

    return { 
        message: "Migración de cobranzas legacy completada.", 
        ventasAnalizadas: ventas.length, 
        cobranzasCreadas: creadas 
    };
};
