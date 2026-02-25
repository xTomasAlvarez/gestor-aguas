import { FILTRO_CONFIG } from "../utils/format";

/**
 * Botones pill para filtrar registros por rango temporal.
 * Props: valor ("hoy"|"semana"|"mes"), onChange(valor)
 */
const FiltroTiempo = ({ valor, onChange }) => (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {FILTRO_CONFIG.map(({ value, label }) => (
            <button
                key={value}
                onClick={() => onChange(value)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    valor === value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                }`}
            >
                {label}
            </button>
        ))}
    </div>
);

export default FiltroTiempo;
