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

export const validarActualizarInventario = [
    body("*").isObject().withMessage("Cada producto debe ser un objeto"),
    body("*.cantidadTotal").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("*.costoReposicion").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),

    body().custom((value, { req }) => {
        if (Object.keys(req.body).length === 0) {
            throw new Error("Debe enviar al menos un producto para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
