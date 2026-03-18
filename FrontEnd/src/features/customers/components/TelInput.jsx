import { useState, useEffect } from "react";

const limpiarArea = (v) => v.replace(/\D/g, "").replace(/^0+/, "");
const limpiarNum  = (v) => v.replace(/\D/g, "").replace(/^15/, "");
const armarTelefono = (prefijo, area, numero) => {
    const p = prefijo.replace(/\D/g, "");
    const a = limpiarArea(area);
    const n = limpiarNum(numero);
    if (!a && !n) return "";
    return `${p}${a}${n}`;
};

const PREFIJOS = [
    { value: "549",  label: "+54 9 (AR movil)" },
    { value: "54",   label: "+54 (AR fijo)"    },
    { value: "598",  label: "+598 (UY)"         },
    { value: "591",  label: "+591 (BO)"         },
];

const TelInput = ({ value, onChange }) => {
    const [prefijo, setPrefijo] = useState("549");
    const [area,    setArea]    = useState("381");
    const [numero,  setNumero]  = useState("");

    useEffect(() => {
        if (!value) {
            setNumero("");
            return;
        }
        const currentPhone = armarTelefono(prefijo, area, numero);
        if (value !== currentPhone && value.length > 3) {
            for (const pref of PREFIJOS) {
                if (value.startsWith(pref.value)) {
                    const resto = value.slice(pref.value.length);
                    setPrefijo(pref.value);
                    setArea(resto.slice(0, 3));
                    setNumero(resto.slice(3));
                    return;
                }
            }
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    const actualizar = (p, a, n) => onChange(armarTelefono(p, a, n));
    const sm = "px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";

    return (
        <div className="flex gap-2 items-center">
            <select value={prefijo} onChange={(e) => { setPrefijo(e.target.value); actualizar(e.target.value, area, numero); }} className={`${sm} w-36 flex-shrink-0`}>
                {PREFIJOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            <input type="text" inputMode="numeric" maxLength={4} value={area} placeholder="Área"
                onChange={(e) => { const v = limpiarArea(e.target.value); setArea(v); actualizar(prefijo, v, numero); }}
                className={`${sm} w-20 flex-shrink-0`} />
            <input type="text" inputMode="numeric" maxLength={10} value={numero} placeholder="Número"
                onChange={(e) => { const v = limpiarNum(e.target.value); setNumero(v); actualizar(prefijo, area, v); }}
                className={`${sm} flex-1 min-w-0`} />
        </div>
    );
};

export default TelInput;
