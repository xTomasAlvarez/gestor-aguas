import axios from "axios";
import toast  from "react-hot-toast";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:3005/api" });

// ── Interceptor de REQUEST: adjunta el token JWT ──────────────────────────
api.interceptors.request.use((config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Interceptor de RESPONSE: si el token expiró, limpia la sesión ─────────
// Referencia lazy al logout del AuthContext — inyectada desde AuthProvider
let _logoutFn = null;
export const setLogoutFn = (fn) => { _logoutFn = fn; };

api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status  = error.response?.status;
        const data    = error.response?.data;

        // Empresa suspendida → redirigir a pantalla de bloqueo
        if (status === 403 && data?.code === "EMPRESA_SUSPENDIDA") {
            if (window.location.pathname !== "/suspended") {
                window.location.href = "/suspended";
            }
            return Promise.reject(error);
        }

        // Token expirado → limpiar sesión y volver al login
        if (status === 401) {
            const tieneToken = !!localStorage.getItem("token");
            if (tieneToken) {
                localStorage.removeItem("token");
                localStorage.removeItem("usuario");
                if (_logoutFn) _logoutFn();
                toast.error("Tu sesion ha expirado. Por favor, ingresa de nuevo.", { duration: 5000 });
                if (window.location.pathname !== "/login") {
                    window.location.href = "/login";
                }
            }
        }
        return Promise.reject(error);
    }
);


export default api;
