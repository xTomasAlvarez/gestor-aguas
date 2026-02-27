import api from "./api";

export const getDashboardStats = (tiempo = "mes") => api.get("/stats/dashboard", { params: { tiempo } });
