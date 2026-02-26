import { createContext, useContext, useState, useEffect } from "react";
import api from "../services/api";
import { useAuth } from "./AuthContext";

const ConfigContext = createContext(null);

export const ConfigProvider = ({ children }) => {
    const { usuario } = useAuth();
    const [config, setConfig] = useState({
        nombre: "App Reparto",
        logo: null,
        telefono: null,
        productos: [],
        cargando: true
    });

    useEffect(() => {
        let mounted = true;
        const fetchConfig = async () => {
            if (!usuario) {
                if (mounted) setConfig(p => ({ ...p, cargando: false }));
                return;
            }
            try {
                if (mounted) setConfig(p => ({ ...p, cargando: true }));
                const { data } = await api.get("/config");
                if (mounted) {
                    setConfig({
                        nombre:    data.nombre || "App Reparto",
                        logo:      data.logo || null,
                        telefono:  data.telefono || null,
                        productos: data.productos || [],
                        cargando: false
                    });
                }
            } catch (error) {
                console.error("Error cargando configuración. Usando defaults.", error);
                if (mounted) setConfig(p => ({ ...p, cargando: false }));
            }
        };
        fetchConfig();
        return () => { mounted = false; };
    }, [usuario]);

    const recargarConfig = async () => {
        try {
            setConfig(p => ({ ...p, cargando: true }));
            const { data } = await api.get("/config");
            setConfig({
                nombre:    data.nombre || "App Reparto",
                logo:      data.logo || null,
                telefono:  data.telefono || null,
                productos: data.productos || [],
                cargando: false
            });
        } catch (error) {
            console.error("Error recargando configuración", error);
            setConfig(p => ({ ...p, cargando: false }));
        }
    };

    return (
        <ConfigContext.Provider value={{ config, recargarConfig }}>
            {children}
        </ConfigContext.Provider>
    );
};

export const useConfig = () => useContext(ConfigContext);
