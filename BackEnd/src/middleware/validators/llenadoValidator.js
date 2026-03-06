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

export const validarCrearLlenado = [
    body("fecha")
        .notEmpty().withMessage("La fecha es obligatoria")
        .isISO8601().withMessage("La fecha debe ser un formato ISO válido"),
    
    body("bidones_20L")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),
        
    body("bidones_12L")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),

    body("sodas")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),

    body("costo_total")
        .optional()
        .isFloat({ min: 0 }).withMessage("El costo total debe ser un número igual o mayor a 0"),

    manejarErroresValidacion
];

export const validarActualizarLlenado = [
    body("fecha")
        .optional()
        .isISO8601().withMessage("La fecha debe ser un formato ISO válido"),
    
    body("bidones_20L")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),
        
    body("bidones_12L")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),

    body("sodas")
        .optional()
        .isInt({ min: 0 }).withMessage("Debe ser un número entero mayor o igual a 0"),

    body("costo_total")
        .optional()
        .isFloat({ min: 0 }).withMessage("El costo total debe ser un número igual o mayor a 0"),

    body().custom((value, { req }) => {
        const { fecha, bidones_20L, bidones_12L, sodas, costo_total } = req.body;
        if (fecha === undefined && bidones_20L === undefined && bidones_12L === undefined && sodas === undefined && costo_total === undefined) {
            throw new Error("Debe enviar al menos un campo para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
