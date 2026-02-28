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

const VentaFila = React.memo(({ venta, onEditar, onAnular }) => {
    const abono = venta.monto_pagado ?? venta.total;
    const saldo = Math.max(0, venta.total - abono);
    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 mb-3 last:mb-0 flex flex-col gap-3 relative">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-slate-800 truncate leading-tight">{venta.cliente?.nombre || "Cliente no disponible"}</p>
                    {(venta.cliente?.direccion || venta.cliente?.localidad) && (
                        <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {venta.cliente.direccion}{venta.cliente.direccion && venta.cliente.localidad ? " - " : ""}{venta.cliente.localidad}
                        </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block font-medium uppercase tracking-wider">{formatFecha(venta.fecha)}</span>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                    <p className="text-lg font-extrabold text-slate-800 leading-none">{formatPeso(venta.total)}</p>
                    <MetodoBadge metodo={venta.metodo_pago} />
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
                {venta.items.length === 0 ? (
                    <span className="text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Cobranza</span>
                ) : (
                    venta.items.map((item, i) => (
                        <span key={i} className="text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-100 px-2 py-1 rounded-lg">
                            {item.cantidad}x {item.producto}
                        </span>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-1">
                <div className="flex gap-2">
                    <button onClick={() => onEditar(venta)} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-3 py-1.5 bg-blue-50 rounded-lg transition-colors">Editar</button>
                    <button onClick={() => onAnular(venta._id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-3 py-1.5 bg-red-50 rounded-lg transition-colors">Anular</button>
                </div>
                {saldo > 0 ? (
                    <div className="bg-red-50 px-3 py-1.5 rounded-lg border border-red-100 flex items-center gap-1.5 break-normal text-right">
                        <span className="text-[10px] uppercase font-bold text-red-400 tracking-wider">Deuda:</span>
                        <span className="text-sm font-extrabold text-red-600">{formatPeso(saldo)}</span>
                    </div>
                ) : (
                    <div className="px-2 py-1 flex items-center gap-1 text-emerald-600">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} className="w-4 h-4 stroke-emerald-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-wider pt-0.5">Saldado</span>
                    </div>
                )}
            </div>
        </div>
    );
});

export default VentaFila;
