import { useState, useEffect } from "react";
import { obtenerVentas } from "../../services/ventasService";
import { formatFecha, formatPeso } from "../../utils/format";
import toast from "react-hot-toast";

// ── Modal Historial de Fiados ─────────────────────────────────────────────
const ModalHistorialFiados = ({ cliente }) => {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                const { data } = await obtenerVentas();
                // Filtrar ventas del cliente específico que tengan deuda de dinero o envases reteniéndose
                const fiados = data.filter(v => 
                    (v.cliente?._id === cliente._id || v.cliente === cliente._id) && 
                    ((v.total - (v.monto_pagado ?? v.total) > 0) || v.metodo_pago === "fiado")
                );
                setVentas(fiados);
            } catch {
                toast.error("Error al cargar el historial de fiados");
            } finally {
                setCargando(false);
            }
        };
        if (cliente) cargar();
    }, [cliente]);

    if (cargando) return <p className="text-center py-6 text-sm text-slate-400">Cargando historial...</p>;
    if (ventas.length === 0) return <p className="text-center py-6 text-sm text-slate-400">Este cliente no tiene tickets impagos registrados.</p>;

    return (
        <div className="flex flex-col gap-3 max-h-96 overflow-y-auto pr-1">
            {ventas.map(v => {
                const abono = v.monto_pagado ?? v.total;
                const saldo = Math.max(0, v.total - abono);
                const tieneEnvases = v.metodo_pago === "fiado" && v.items.length > 0;
                
                return (
                    <div key={v._id} className="bg-white border border-red-100 rounded-xl p-4 shadow-sm relative">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{formatFecha(v.fecha)}</span>
                            {saldo > 0 && <span className="text-lg font-black text-red-600 leading-none">{formatPeso(saldo)}</span>}
                        </div>
                        <div className="flex flex-wrap gap-1.5 mt-2 transition-all">
                            {v.items.length === 0 && <span className="text-[11px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Cobranza (saldo remanente)</span>}
                            {v.items.map((item, i) => (
                                <span key={i} className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-md">
                                    {item.cantidad}x {item.producto}
                                </span>
                            ))}
                            {tieneEnvases && <span className="text-[11px] font-bold text-red-500 ml-1 mt-0.5">*(Envases en Mora)</span>}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default ModalHistorialFiados;
