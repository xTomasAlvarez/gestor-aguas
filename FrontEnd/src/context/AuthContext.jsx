import { createContext, useContext, useState, useCallback } from "react";

const AuthContext = createContext(null);

// Lee el usuario guardado en localStorage de forma segura
const leerUsuario = () => {
    try { return JSON.parse(localStorage.getItem("usuario")); }
    catch { return null; }
};

export const AuthProvider = ({ children }) => {
    const [usuario, setUsuario] = useState(leerUsuario);

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

    return (
        <AuthContext.Provider value={{ usuario, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
