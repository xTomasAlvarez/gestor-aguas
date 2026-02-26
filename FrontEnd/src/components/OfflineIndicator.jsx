import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

/**
 * Muestra un banner discreto cuando el usuario pierde la conexión a internet.
 * Se oculta automáticamente cuando recupera la conexión.
 */
const OfflineIndicator = () => {
    const [offline, setOffline] = useState(!navigator.onLine);

    useEffect(() => {
        const goOffline = () => setOffline(true);
        const goOnline  = () => setOffline(false);
        window.addEventListener("offline", goOffline);
        window.addEventListener("online",  goOnline);
        return () => {
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online",  goOnline);
        };
    }, []);

    if (!offline) return null;

    return (
        <div className="fixed bottom-16 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
            <div className="flex items-center gap-2 bg-slate-800 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-lg border border-slate-700 animate-pulse">
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                Sin conexion — trabajando en modo local
            </div>
        </div>
    );
};

export default OfflineIndicator;
