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

export const validarCrearGasto = [
    body("concepto")
        .trim()
        .notEmpty().withMessage("El concepto es obligatorio")
        .isString().withMessage("El concepto debe ser un texto")
        .isLength({ min: 2, max: 100 }).withMessage("El concepto debe tener entre 2 y 100 caracteres"),

    body("monto")
        .notEmpty().withMessage("El monto es obligatorio")
        .isFloat({ gt: 0 }).withMessage("El monto debe ser numérico y estrictamente mayor a 0"),

    body("fecha")
        .notEmpty().withMessage("La fecha es obligatoria")
        .isISO8601().withMessage("La fecha debe ser un formato ISO válido"),

    manejarErroresValidacion
];

export const validarActualizarGasto = [
    body("concepto")
        .optional()
        .trim()
        .isString().withMessage("El concepto debe ser un texto")
        .isLength({ min: 2, max: 100 }).withMessage("El concepto debe tener entre 2 y 100 caracteres"),

    body("monto")
        .optional()
        .isFloat({ gt: 0 }).withMessage("El monto debe ser numérico y estrictamente mayor a 0"),

    body("fecha")
        .optional()
        .isISO8601().withMessage("La fecha debe ser un formato ISO válido"),

    body().custom((value, { req }) => {
        const { concepto, monto, fecha } = req.body;
        if (concepto === undefined && monto === undefined && fecha === undefined) {
            throw new Error("Debe enviar al menos un campo para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
