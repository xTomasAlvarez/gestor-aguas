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

export const validarCrearCliente = [
    body("nombre")
        .trim()
        .notEmpty().withMessage("El nombre es obligatorio")
        .isString().withMessage("El nombre debe ser un texto")
        .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    
    body("direccion")
        .optional()
        .trim()
        .isString().withMessage("La dirección debe ser un texto")
        .isLength({ max: 200 }).withMessage("La dirección no puede superar los 200 caracteres"),
        
    body("telefono")
        .optional()
        .trim()
        .isString().withMessage("El teléfono debe ser un texto")
        .isLength({ min: 6, max: 20 }).withMessage("El teléfono debe tener entre 6 y 20 caracteres"),

    manejarErroresValidacion
];

export const validarActualizarCliente = [
    body("nombre")
        .optional()
        .trim()
        .isString().withMessage("El nombre debe ser un texto")
        .isLength({ min: 2, max: 100 }).withMessage("El nombre debe tener entre 2 y 100 caracteres"),
    
    body("direccion")
        .optional()
        .trim()
        .isString().withMessage("La dirección debe ser un texto")
        .isLength({ max: 200 }).withMessage("La dirección no puede superar los 200 caracteres"),
        
    body("telefono")
        .optional()
        .trim()
        .isString().withMessage("El teléfono debe ser un texto")
        .isLength({ min: 6, max: 20 }).withMessage("El teléfono debe tener entre 6 y 20 caracteres"),

    body("dispensersAsignados")
        .optional()
        .isInt({ min: 0 }).withMessage("Dispensers asignados debe ser un número entero mayor o igual a 0"),

    body().custom((value, { req }) => {
        const { nombre, direccion, telefono, dispensersAsignados } = req.body;
        if (nombre === undefined && direccion === undefined && telefono === undefined && dispensersAsignados === undefined) {
            throw new Error("Debe enviar al menos un campo para actualizar");
        }
        return true;
    }),

    manejarErroresValidacion
];
