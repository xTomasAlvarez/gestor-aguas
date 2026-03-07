import { body, validationResult } from "express-validator";

const manejarErroresValidacion = (req, res, next) => {
    const errores = validationResult(req);
    if (!errores.isEmpty()) {
        return res.status(400).json({
            message: "Datos de entrada inválidos.",
            errores: errores.array().map(e => ({
                campo: e.path,
                mensaje: e.msg
            }))
        });
    }
    next();
};

export const validarCrearVenta = [
    body("cliente").isMongoId().withMessage("Debe ser un MongoId válido"),
    body("metodo_pago").isIn(["efectivo", "transferencia", "fiado"]).withMessage("Método de pago inválido"),
    body("total").isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),
    body("monto_pagado").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),
    body("fecha").optional().isISO8601().withMessage("Debe ser una fecha ISO válida"),
    body("items").optional().isArray().withMessage("Debe ser un array"),
    body("items.*.producto").if(body("items").exists()).isString().notEmpty().withMessage("Producto no debe estar vacío"),
    body("items.*.cantidad").if(body("items").exists()).isInt({ min: 1 }).withMessage("Cantidad debe ser entero >= 1"),
    body("items.*.precio_unitario").if(body("items").exists()).isFloat({ min: 0 }).withMessage("Precio debe ser >= 0"),
    body("items.*.subtotal").if(body("items").exists()).isFloat({ min: 0 }).withMessage("Subtotal debe ser >= 0"),
    manejarErroresValidacion
];

export const validarActualizarVenta = [
    body("cliente").optional().isMongoId().withMessage("Debe ser un MongoId válido"),
    body("metodo_pago").optional().isIn(["efectivo", "transferencia", "fiado"]).withMessage("Método de pago inválido"),
    body("total").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),
    body("monto_pagado").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),
    body("fecha").optional().isISO8601().withMessage("Debe ser una fecha ISO válida"),
    body("items").optional().isArray().withMessage("Debe ser un array"),
    body("items.*.producto").if(body("items").exists()).isString().notEmpty().withMessage("Producto no debe estar vacío"),
    body("items.*.cantidad").if(body("items").exists()).isInt({ min: 1 }).withMessage("Cantidad debe ser entero >= 1"),
    body("items.*.precio_unitario").if(body("items").exists()).isFloat({ min: 0 }).withMessage("Precio debe ser >= 0"),
    body("items.*.subtotal").if(body("items").exists()).isFloat({ min: 0 }).withMessage("Subtotal debe ser >= 0"),
    manejarErroresValidacion
];

export const validarRegistrarCobranza = [
    body("clienteId").isMongoId().withMessage("Debe ser un MongoId válido"),
    body("ticketId").isMongoId().withMessage("Debe ser un MongoId válido"),
    body("montoAbonado").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),
    body("metodoPago").optional().isIn(["efectivo", "transferencia"]).withMessage("Método de pago inválido"),
    body("envasesDevueltos").optional().isObject().withMessage("Debe ser un objeto"),
    body("envasesDevueltos.bidones_20L").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("envasesDevueltos.bidones_12L").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("envasesDevueltos.sodas").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    manejarErroresValidacion
];
