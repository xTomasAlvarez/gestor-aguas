import api from "./api";

// POST /api/auth/login
export const loginService = (email, password) => {
    console.log("[AUTH] Conectando a:", `${api.defaults.baseURL}/auth/login`);
    return api.post("/auth/login", { email, password });
};

// POST /api/auth/registrar
export const registrarService = (nombre, email, password, registrationKey) => {
    console.log("[AUTH] Conectando a:", `${api.defaults.baseURL}/auth/registrar`);
    return api.post("/auth/registrar", { nombre, email, password, registrationKey });
};

