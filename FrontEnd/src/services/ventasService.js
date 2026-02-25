import api from "./api.js";

const BASE = "/ventas";

export const obtenerVentas  = ()          => api.get(BASE);
export const crearVenta     = (datos)     => api.post(BASE, datos);
export const anularVenta    = (id)        => api.delete(`${BASE}/${id}`);
export const actualizarVenta = (id, datos) => api.put(`${BASE}/${id}`, datos);
