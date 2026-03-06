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

export const validarActualizarConfig = [
    body("nombre")
        .optional()
        .trim()
        .isString().withMessage("El nombre debe ser un texto")
        .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    
    body("logo")
        .optional()
        .isString().withMessage("El logo debe ser un texto")
        .isURL().withMessage("El logo debe ser una URL válida"),

    body("telefono")
        .optional()
        .trim()
        .isString().withMessage("El teléfono debe ser un texto")
        .isLength({ min: 6, max: 20 }).withMessage("El teléfono debe tener entre 6 y 20 caracteres"),

    body("productos")
        .optional()
        .isArray().withMessage("Los productos deben ser un array"),

    body("onboardingCompletado")
        .optional()
        .isBoolean().withMessage("El onboardingCompletado debe ser booleano"),

    body().custom((value, { req }) => {
        const { nombre, logo, telefono, productos, onboardingCompletado } = req.body;
        if (nombre === undefined && logo === undefined && telefono === undefined && productos === undefined && onboardingCompletado === undefined) {
            throw new Error("Debe enviar al menos un campo para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
