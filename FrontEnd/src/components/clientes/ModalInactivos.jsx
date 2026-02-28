import { useState, useCallback, useEffect } from "react";
import { obtenerInactivos, toggleEstadoCliente } from "../../services/clienteService";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";

// ── Modal de clientes inactivos ───────────────────────────────────────────
const ModalInactivos = ({ onReactivar }) => {
    const [inactivos,  setInactivos]  = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [busqueda,   setBusqueda]   = useState("");
    const [procesando, setProcesando] = useState(null);

    const cargar = useCallback(async (nombre = "") => {
        try {
            setCargando(true);
            const { data } = await obtenerInactivos(nombre);
            setInactivos(data);
        } catch { toast.error("Error al cargar clientes inactivos."); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => cargar(busqueda), 350);
        return () => clearTimeout(t);
    }, [busqueda, cargar]);

    const handleReactivar = async (cliente) => {
        setProcesando(cliente._id);
        const tid = toast.loading(`Reactivando a ${cliente.nombre}...`);
        try {
            const { data } = await toggleEstadoCliente(cliente._id);
            toast.success(`${data.cliente.nombre} reactivado correctamente.`, { id: tid });
            setInactivos((prev) => prev.filter((c) => c._id !== cliente._id));
            onReactivar(data.cliente);
        } catch {
            toast.error("Error al reactivar el cliente.", { id: tid });
        } finally {
            setProcesando(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <input type="text" placeholder="Buscar inactivo..." value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />

            {cargando ? (
                <p className="text-center py-8 text-sm text-slate-400">Cargando...</p>
            ) : inactivos.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-400">No hay clientes inactivos.</p>
            ) : (
                <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {inactivos.map((c) => (
                        <li key={c._id} className="py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-slate-500">{c.nombre.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-600 truncate">{c.nombre}</p>
                                {(c.direccion || c.localidad) && (
                                    <p className="text-xs text-slate-400 truncate">
                                        {c.direccion}{c.direccion && c.localidad ? " - " : ""}{c.localidad}
                                    </p>
                                )}
                            </div>
                            <button
                                onClick={() => handleReactivar(c)}
                                disabled={procesando === c._id}
                                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors">
                                <RotateCcw className="w-3.5 h-3.5" />
                                {procesando === c._id ? "..." : "Reactivar"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default ModalInactivos;
