import api from "@/core/http/api";

const BASE = "/superadmin";

export const getEmpresas        = ()     => api.get(`${BASE}/empresas`);
export const toggleSuspender    = (id)   => api.patch(`${BASE}/empresas/${id}/suspend`);
