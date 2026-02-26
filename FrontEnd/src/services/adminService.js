import api from "./api.js";

const BASE = "/admin";

export const listarUsuarios  = ()     => api.get(`${BASE}/usuarios`);
export const toggleActivo    = (id)   => api.patch(`${BASE}/usuarios/${id}/activo`);
export const eliminarUsuario = (id)   => api.delete(`${BASE}/usuarios/${id}`);
export const obtenerEmpresa  = ()     => api.get(`${BASE}/empresa`);
