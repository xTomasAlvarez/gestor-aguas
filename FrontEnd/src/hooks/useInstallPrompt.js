import { useState, useEffect } from "react";

/**
 * Hook que escucha el evento `beforeinstallprompt` del navegador.
 * Devuelve { promptInstall } — llama a promptInstall() para mostrar el diálogo nativo.
 * Si el navegador no soporta PWA install o ya está instalada, promptInstall es null.
 */
const useInstallPrompt = () => {
    const [deferredPrompt, setDeferredPrompt] = useState(null);

    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();           // Evita que Chrome muestre el mini-banner automático
            setDeferredPrompt(e);
        };
        window.addEventListener("beforeinstallprompt", handler);
        return () => window.removeEventListener("beforeinstallprompt", handler);
    }, []);

    const promptInstall = async () => {
        if (!deferredPrompt) return;
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === "accepted") setDeferredPrompt(null);
    };

    return { canInstall: !!deferredPrompt, promptInstall };
};

export default useInstallPrompt;
