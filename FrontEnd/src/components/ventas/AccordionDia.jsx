import React from "react";
import VentaFila from "./VentaFila";
import { formatFechaDia, formatPeso } from "../../utils/format";

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onAnular }) => (
    <div className={`bg-white/70 backdrop-blur-md shadow-glass rounded-3xl overflow-hidden mb-4 transition-all duration-300 border ${expanded ? "border-blue-200/50" : "border-white/60"}`}>
        <button onClick={() => onToggle(diaKey)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/90 transition-colors text-left">
            <div>
                <p className="text-base font-black font-display tracking-tight text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{items.length} {items.length === 1 ? "venta" : "ventas"}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-lg font-black font-display text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">{formatPeso(items.reduce((a, v) => a + v.total, 0))}</p>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-transform duration-300 ${expanded ? "bg-slate-100 rotate-180" : "bg-slate-50"}`}>
                    <span className="text-slate-400 text-xs font-bold">▼</span>
                </div>
            </div>
        </button>
        {expanded && (
            <div className="px-5 pb-5 border-t border-slate-100/50 bg-slate-50/30 pt-5 animate-fade-in-up">
                {items.map((v) => <VentaFila key={v._id} venta={v} onEditar={onEditar} onAnular={onAnular} />)}
            </div>
        )}
    </div>
);

export default AccordionDia;
