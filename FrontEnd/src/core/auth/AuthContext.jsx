import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api, { setLogoutFn } from "@/core/http/api";
import { logoutService } from "@/core/auth/services/authService";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(null);
    const [cargandoAuth, setCargandoAuth] = useState(true); // Bloquea la app hasta validar la sesión

    const login = useCallback((usuario) => {
        setUsuario(usuario);
    }, []);

    const logout = useCallback(async () => {
        if (usuario) { // Solo intentar desloguear si hay un usuario
            try {
                await logoutService();
            } catch (error) {
                console.error("Fallo al intentar cerrar sesión en el backend:", error);
            } finally {
                setUsuario(null);
            }
        }
    }, [usuario]);

    // Inyecta una versión estable del `logout` en el interceptor de Axios
    useEffect(() => {
        const stableLogout = async () => {
            try {
                await logoutService();
            } catch (error) {
                 console.error("Fallo al intentar cerrar sesión en el backend (interceptor):", error);
            } finally {
                setUsuario(null);
            }
        };
        setLogoutFn(() => stableLogout);
        return () => setLogoutFn(null);
    }, []);


    // Verifica si hay una sesión activa en el Backend al cargar la app
    useEffect(() => {
        let mounted = true;
        const verificarSesionBackend = async () => {
            try {
                const { data } = await api.get("/auth/me");
                if (mounted) {
                    setUsuario(data.usuario);
                }
            } catch (err) {
                if (mounted) {
                    setUsuario(null);
                }
            } finally {
                if (mounted) {
                    setCargandoAuth(false);
                }
            }
        };

        verificarSesionBackend();
        return () => { mounted = false; };
    }, []);

    return (
        <AuthContext.Provider value={{ usuario, cargandoAuth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);

