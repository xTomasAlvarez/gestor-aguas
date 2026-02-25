import api from "./api.js";

const BASE = "/gastos";

export const obtenerGastos = ()        => api.get(BASE);
export const crearGasto    = (datos)   => api.post(BASE, datos);
export const eliminarGasto = (id)      => api.delete(`${BASE}/${id}`);
export const actualizarGasto = (id, datos) => api.put(`${BASE}/${id}`, datos);
