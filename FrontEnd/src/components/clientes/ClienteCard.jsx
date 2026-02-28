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
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight flex items-center gap-2">
                        {nombre}
                        {dispensersAsignados > 0 && <span className="px-1.5 py-0.5 bg-violet-100 text-violet-700 text-[10px] uppercase font-black tracking-wider rounded">Eq: {dispensersAsignados}</span>}
                    </h2>
                    {(direccion || localidad) && (
                        <p className="text-sm text-slate-500 mt-0.5">
                            {direccion}{direccion && localidad ? " - " : ""}{localidad}
                        </p>
                    )}
                    {telDisplay && <a href={`tel:+${telefono}`} className="text-sm text-blue-600 hover:underline mt-0.5 block font-mono">{telDisplay}</a>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${tieneDeuda ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {tieneDeuda ? "Con deuda" : "Al dia"}
                </span>
            </div>
            <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Envases adeudados</p>
                <div className="grid grid-cols-3 gap-2">
                    {[{ label:"Bidon 20L", val:bidones_20L },{ label:"Bidon 12L", val:bidones_12L },{ label:"Sodas", val:sodas }].map(({label,val})=>(
                        <div key={label} className={`rounded-xl p-2.5 text-center ${val>0?"bg-red-50":"bg-slate-50"}`}>
                            <p className={`text-xl font-bold leading-none ${val>0?"text-red-600":"text-slate-400"}`}>{val}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>
            {saldo_pendiente > 0 && (
                <div className="bg-red-600 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-red-200 uppercase tracking-wider">Monto adeudado</p>
                        <p className="text-xl font-extrabold text-white mt-0.5">${saldo_pendiente.toLocaleString("es-AR")}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="w-7 h-7 stroke-red-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                </div>
            )}
            <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => onEditar(cliente)} className={btnSecondary}>Editar</button>
                <button onClick={() => onVerHistorico(cliente)} className={btnSecondary}>Fiados</button>
                <button onClick={() => onDesactivar(cliente)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                    Desactivar
                </button>
            </div>
        </div>
    );
});

export default ClienteCard;
