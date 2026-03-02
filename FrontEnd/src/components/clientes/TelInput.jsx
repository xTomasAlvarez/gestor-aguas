import { useState, useEffect } from "react";
import { Select, TextInput, Group } from "@mantine/core";

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

    return (
        <Group gap="xs" wrap="nowrap" align="center" className="w-full">
            <Select 
                data={PREFIJOS} 
                value={prefijo} 
                onChange={(val) => { setPrefijo(val); actualizar(val, area, numero); }} 
                className="w-[150px] flex-shrink-0"
                comboboxProps={{ shadow: 'sm' }}
            />
            <TextInput 
                type="tel"
                inputMode="numeric" 
                maxLength={4} 
                value={area} 
                placeholder="Área"
                onChange={(e) => { const v = limpiarArea(e.target.value); setArea(v); actualizar(prefijo, v, numero); }}
                className="w-[90px] flex-shrink-0" 
            />
            <TextInput 
                type="tel"
                inputMode="numeric" 
                maxLength={10} 
                value={numero} 
                placeholder="Número"
                onChange={(e) => { const v = limpiarNum(e.target.value); setNumero(v); actualizar(prefijo, area, v); }}
                className="flex-1 min-w-0" 
            />
        </Group>
    );
};

export default TelInput;
