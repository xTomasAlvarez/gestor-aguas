import api from "./api";

// POST /api/auth/login
export const loginService = (email, password) => {
    console.log("[AUTH] Conectando a:", `${api.defaults.baseURL}/auth/login`);
    return api.post("/auth/login", { email, password });
};

// POST /api/auth/registrar
// Caso A (empleado): { nombre, email, password, inviteCode }
// Caso B (admin):    { nombre, email, password, nombreEmpresa, masterCode }
export const registrarService = (payload) => {
    console.log("[AUTH] Conectando a:", `${api.defaults.baseURL}/auth/registrar`);
    return api.post("/auth/registrar", payload);
};
