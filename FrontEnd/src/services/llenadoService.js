import api from "./api.js";

const BASE = "/llenados";

export const obtenerLlenados  = ()        => api.get(BASE);
export const crearLlenado     = (datos)   => api.post(BASE, datos);
export const eliminarLlenado  = (id)      => api.delete(`${BASE}/${id}`);
export const actualizarLlenado = (id, datos) => api.put(`${BASE}/${id}`, datos);
