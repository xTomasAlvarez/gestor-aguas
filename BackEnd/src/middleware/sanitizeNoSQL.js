/**
 * Middleware para desinfectar entradas (evita NoSQL Injection).
 * 
 * Express 5 no permite reasignar `req.query`, por lo tanto, mutamos 
 * el objeto de forma segura eliminando claves que empiezan con "$" o "."
 */

const sanitize = (obj) => {
    if (obj instanceof Object) {
        for (const key in obj) {
            if (/^\$|\./.test(key)) {
                delete obj[key];
            } else {
                sanitize(obj[key]);
            }
        }
    }
};

export const sanitizeNoSQL = (req, res, next) => {
    // Aplicar a los orígenes comunes de inyección
    ["body", "query", "params"].forEach((key) => {
        if (req[key]) {
            sanitize(req[key]);
        }
    });
    next();
};
