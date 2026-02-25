import axios from "axios";

const api = axios.create({ baseURL: "http://localhost:3005/api" });

// ── Interceptor de REQUEST: adjunta el token JWT ──────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Interceptor de RESPONSE: si el token expiró, limpia la sesión ─────────
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token inválido/expirado → limpiar y redirigir al login
            localStorage.removeItem("token");
            localStorage.removeItem("usuario");
            if (window.location.pathname !== "/login") {
                window.location.href = "/login";
            }
        }
        return Promise.reject(error);
    }
);

export default api;
