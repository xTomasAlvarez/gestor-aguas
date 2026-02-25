import api from "./api";

// POST /api/auth/login
export const loginService = (email, password) =>
    api.post("/auth/login", { email, password });

// POST /api/auth/registrar
export const registrarService = (nombre, email, password, rol) =>
    api.post("/auth/registrar", { nombre, email, password, rol });
