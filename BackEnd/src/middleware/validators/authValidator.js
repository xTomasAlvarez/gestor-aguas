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

export const validarRegistrar = [
    body("nombre")
        .trim()
        .notEmpty().withMessage("El nombre es obligatorio")
        .isString().withMessage("El nombre debe ser un texto")
        .isLength({ min: 2, max: 50 }).withMessage("El nombre debe tener entre 2 y 50 caracteres"),
    
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio")
        .isEmail().withMessage("Debe ser un email válido")
        .normalizeEmail(),
        
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria")
        .isLength({ min: 6 }).withMessage("La contraseña debe tener al menos 6 caracteres"),

    body("inviteCode")
        .optional()
        .isString().withMessage("El inviteCode debe ser un texto")
        .trim()
        .notEmpty().withMessage("El inviteCode no puede estar vacío si se proporciona"),

    body("nombreEmpresa")
        .optional()
        .isString().withMessage("El nombre de la empresa debe ser un texto")
        .trim()
        .isLength({ max: 100 }).withMessage("El nombre de la empresa no puede superar los 100 caracteres"),

    body("masterCode")
        .optional()
        .isString().withMessage("El masterCode debe ser un texto")
        .trim()
        .notEmpty().withMessage("El masterCode no puede estar vacío si se proporciona"),

    manejarErroresValidacion
];

export const validarLogin = [
    body("email")
        .trim()
        .notEmpty().withMessage("El email es obligatorio")
        .isEmail().withMessage("Debe ser un email válido")
        .normalizeEmail(),
        
    body("password")
        .notEmpty().withMessage("La contraseña es obligatoria"),

    manejarErroresValidacion
];
