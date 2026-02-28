import api from "./api";

// POST /api/auth/login
export const loginService = (email, password) => {
    return api.post("/auth/login", { email, password });
};

// POST /api/auth/registrar
// Caso A (empleado): { nombre, email, password, inviteCode }
// Caso B (admin):    { nombre, email, password, nombreEmpresa, masterCode }
export const registrarService = (payload) => {
    return api.post("/auth/registrar", payload);
};
