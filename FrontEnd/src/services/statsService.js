import api from "./api";

export const getDashboardStats = () => api.get("/stats/dashboard");
