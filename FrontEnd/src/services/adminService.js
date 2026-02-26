import api from "./api.js";

const BASE = "/admin";

// Personal y Empresa (existentes)
export const listarUsuarios   = ()       => api.get(`${BASE}/usuarios`);
export const toggleActivo     = (id)     => api.patch(`${BASE}/usuarios/${id}/activo`);
export const eliminarUsuario  = (id)     => api.delete(`${BASE}/usuarios/${id}`);
export const obtenerEmpresa   = ()       => api.get(`${BASE}/empresa`);
export const crearEmpresa     = (nombre) => api.post(`${BASE}/empresa/crear`, { nombre });
export const regenerarCodigo  = ()       => api.patch(`${BASE}/empresa/regenerar-codigo`);

// Configuración White Label (nuevos)
export const actualizarIdentidad = (payload)   => api.put("/config", payload);
export const actualizarCatalogo  = (productos) => api.put("/config", { productos });
