import api from "./api.js";

const BASE = "/superadmin";

export const getEmpresas        = ()     => api.get(`${BASE}/empresas`);
export const toggleSuspender    = (id)   => api.patch(`${BASE}/empresas/${id}/suspend`);
