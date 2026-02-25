import api from "./api.js";

/**
 * Factory que genera los 4 métodos CRUD estándar para un endpoint REST.
 * @param {string} base  Ruta base, ej. "/ventas"
 */
export const crearCrudService = (base) => ({
    obtener:     ()           => api.get(base),
    crear:       (datos)      => api.post(base, datos),
    actualizar:  (id, datos)  => api.put(`${base}/${id}`, datos),
    eliminar:    (id)         => api.delete(`${base}/${id}`),
});
