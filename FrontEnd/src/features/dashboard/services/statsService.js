import api from "@/core/http/api";

export const getDashboardStats = (tiempo = "mes") => api.get("/stats/dashboard", { params: { tiempo } });
