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
    body("bidones20L").optional().isObject().withMessage("Debe ser un objeto"),
    body("bidones20L.cantidadTotal").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("bidones20L.costoReposicion").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),

    body("bidones12L").optional().isObject().withMessage("Debe ser un objeto"),
    body("bidones12L.cantidadTotal").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("bidones12L.costoReposicion").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),

    body("sodas").optional().isObject().withMessage("Debe ser un objeto"),
    body("sodas.cantidadTotal").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("sodas.costoReposicion").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),

    body("dispensers").optional().isObject().withMessage("Debe ser un objeto"),
    body("dispensers.cantidadTotal").optional().isInt({ min: 0 }).withMessage("Debe ser entero >= 0"),
    body("dispensers.costoReposicion").optional().isFloat({ min: 0 }).withMessage("Debe ser número mayor o igual a 0"),

    body().custom((value, { req }) => {
        const { bidones20L, bidones12L, sodas, dispensers } = req.body;
        if (bidones20L === undefined && bidones12L === undefined && sodas === undefined && dispensers === undefined) {
            throw new Error("Debe enviar al menos un producto para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
