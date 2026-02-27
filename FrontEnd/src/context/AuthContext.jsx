import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setLogoutFn } from "../services/api";

const AuthContext = createContext(null);

// Lee el usuario guardado en localStorage de forma segura
const leerUsuario = () => {
    try { return JSON.parse(localStorage.getItem("usuario")); }
    catch { return null; }
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(leerUsuario);
    const [cargandoAuth, setCargandoAuth] = useState(true); // Bloquea la app hasta validar el token

    const login = useCallback(({ token, usuario }) => {
        localStorage.setItem("token",   token);
        localStorage.setItem("usuario", JSON.stringify(usuario));
        setUsuario(usuario);
    }, []);

    const logout = useCallback(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("usuario");
        setUsuario(null);
    }, []);

    // Registra el logout en el interceptor de Axios para manejar expiración de token
    useEffect(() => {
        setLogoutFn(logout);
        return () => setLogoutFn(null);
    }, [logout]);

    // Función que verifica si el JWT local sigue siendo válido en el Backend
    useEffect(() => {
        let mounted = true;
        const verificarSesionBackend = async () => {
            const token = localStorage.getItem("token");
            if (!token) {
                if (mounted) setCargandoAuth(false);
                return;
            }
            try {
                const { data } = await api.get("/auth/me");
                if (mounted) {
                    setUsuario(data.usuario);
                    localStorage.setItem("usuario", JSON.stringify(data.usuario));
                }
            } catch (err) {
                console.warn("Token expirado o inválido. Cerrando sesión de seguridad.", err);
                logout(); // Si responde 401 el interceptor limpia, pero por las dudas
            } finally {
                if (mounted) setCargandoAuth(false);
            }
        };

        verificarSesionBackend();
        return () => { mounted = false; };
    }, [logout]);

    return (
        <AuthContext.Provider value={{ usuario, cargandoAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
