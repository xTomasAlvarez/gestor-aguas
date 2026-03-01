import React from "react";
import { formatFecha, formatPeso } from "../../utils/format";

const METODO_CLS = {
    efectivo:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    fiado:         "bg-red-50    text-red-700    border-red-200",
    transferencia: "bg-blue-50   text-blue-700   border-blue-200",
};
const MetodoBadge = ({ metodo }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${METODO_CLS[metodo] || "bg-slate-100"}`}>
        {metodo}
    </span>
);

const VentaFila = ({ venta, onEditar, onAnular }) => {
    const abono = venta.monto_pagado ?? venta.total;
    const saldo = Math.max(0, venta.total - abono);
    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-5 mb-3 lg:mb-4 last:mb-0 flex flex-col gap-3.5 relative hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-black font-display text-slate-800 truncate tracking-tight leading-tight">{venta.cliente?.nombre || "Cliente no disponible"}</p>
                    {(venta.cliente?.direccion || venta.cliente?.localidad) && (
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate tracking-wide">
                            {venta.cliente.direccion}{venta.cliente.direccion && venta.cliente.localidad ? " - " : ""}{venta.cliente.localidad}
                        </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block font-bold uppercase tracking-widest">{formatFecha(venta.fecha)}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-xl font-black font-display text-slate-800 tracking-tight leading-none">{formatPeso(venta.total)}</p>
                    <MetodoBadge metodo={venta.metodo_pago} />
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
                {venta.items.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl tracking-wide">Cobranza pura</span>
                ) : (
                    venta.items.map((item, i) => (
                        <span key={i} className="text-[11px] font-bold bg-blue-50 text-blue-700 shadow-sm border border-blue-100 px-2.5 py-1 rounded-xl">
                            {item.cantidad}x {item.producto}
                        </span>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100/60 mt-0.5">
                <div className="flex gap-2">
                    <button onClick={() => onEditar(venta)} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-4 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-colors">Editar</button>
                    <button onClick={() => onAnular(venta._id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 rounded-xl transition-colors">Anular</button>
                </div>
                {saldo > 0 ? (
                    <div className="bg-red-50/80 px-4 py-2 rounded-xl border border-red-200/50 flex items-center gap-2 break-normal text-right shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-red-400 tracking-widest">Deuda:</span>
                        <span className="text-base font-black font-display text-red-600">{formatPeso(saldo)}</span>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} className="w-4 h-4 stroke-emerald-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-widest pt-0.5">Saldado</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default VentaFila;
