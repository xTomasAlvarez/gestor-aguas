import React from "react";
import VentaFila from "./VentaFila";
import { formatFechaDia, formatPeso } from "../../utils/format";

const AccordionDia = React.memo(({ diaKey, items, expanded, onToggle, onEditar, onAnular }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => onToggle(diaKey)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
            <div>
                <p className="text-sm font-bold text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? "venta" : "ventas"}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-slate-700">{formatPeso(items.reduce((a, v) => a + v.total, 0))}</p>
                <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
            </div>
        </button>
        {expanded && (
            <div className="px-4 pb-4 border-t border-slate-100 bg-slate-50/50 pt-3">
                {items.map((v) => <VentaFila key={v._id} venta={v} onEditar={onEditar} onAnular={onAnular} />)}
            </div>
        )}
    </div>
));

export default AccordionDia;
