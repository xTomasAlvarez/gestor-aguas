import React from "react";
import { btnSecondary } from "../../styles/cls";
import { Archive } from "lucide-react";

// ── Tarjeta de cliente activo ─────────────────────────────────────────────
const ClienteCard = React.memo(({ cliente, onEditar, onDesactivar, onVerHistorico }) => {
    const { nombre, direccion, localidad, telefono, deuda, saldo_pendiente = 0, dispensersAsignados = 0 } = cliente;
    const { bidones_20L = 0, bidones_12L = 0, sodas = 0 } = deuda || {};
    const tieneDeuda = bidones_20L > 0 || bidones_12L > 0 || sodas > 0 || saldo_pendiente > 0;
    const telDisplay = telefono ? `+${telefono.slice(0,2)} ${telefono.slice(2,5)} ${telefono.slice(5,8)}-${telefono.slice(8)}` : null;

    return (
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-glass border border-white/60 p-6 flex flex-col gap-4 hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <h2 className="text-xl font-black text-slate-800 leading-tight flex items-center gap-2 font-display tracking-tight truncate">
                        {nombre}
                        {dispensersAsignados > 0 && <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[10px] uppercase font-black tracking-widest rounded-lg shadow-sm">Eq: {dispensersAsignados}</span>}
                    </h2>
                    {(direccion || localidad) && (
                        <p className="text-sm font-medium text-slate-500 mt-1 truncate">
                            {direccion}{direccion && localidad ? " - " : ""}{localidad}
                        </p>
                    )}
                    {telDisplay && <a href={`tel:+${telefono}`} className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mt-1 block tracking-wide">{telDisplay}</a>}
                </div>
                <span className={`text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap shadow-sm border ${tieneDeuda ? "bg-red-50 text-red-600 border-red-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
                    {tieneDeuda ? "Con deuda" : "Al dia"}
                </span>
            </div>
            
            <div className="border-t border-slate-100/60 pt-4">
                <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2.5">Envases adeudados</p>
                <div className="grid grid-cols-3 gap-3">
                    {[{ label:"Bidón 20L", val:bidones_20L },{ label:"Bidón 12L", val:bidones_12L },{ label:"Sodas", val:sodas }].map(({label,val})=>(
                        <div key={label} className={`rounded-2xl p-3 text-center border transition-colors ${val>0?"bg-red-50/80 border-red-100":"bg-white/50 border-slate-100"}`}>
                            <p className={`text-2xl font-black font-display leading-none ${val>0?"text-red-600":"text-slate-300"}`}>{val}</p>
                            <p className="text-[10px] font-bold text-slate-500 mt-1.5 uppercase tracking-wide">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
            
            {saldo_pendiente > 0 && (
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-2xl px-5 py-4 flex items-center justify-between shadow-sm border border-red-400/50">
                    <div>
                        <p className="text-[10px] font-bold text-red-100 uppercase tracking-widest leading-none mb-1">Monto adeudado</p>
                        <p className="text-2xl font-black text-white font-display tracking-tight">${saldo_pendiente.toLocaleString("es-AR")}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-red-400/30 flex items-center justify-center">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} className="w-6 h-6 stroke-white">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                        </svg>
                    </div>
                </div>
            )}
            
            <div className="flex gap-2 pt-2 border-t border-slate-100/60 mt-1">
                <button onClick={() => onEditar(cliente)} className={btnSecondary}>Editar</button>
                <button onClick={() => onVerHistorico(cliente)} className={btnSecondary}>Fiados</button>
                <button onClick={() => onDesactivar(cliente)}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-2xl text-sm font-bold border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-all active:scale-[0.98] font-display">
                    <Archive className="w-4 h-4" />
                    Baja
                </button>
            </div>
        </div>
    );
});

export default ClienteCard;
