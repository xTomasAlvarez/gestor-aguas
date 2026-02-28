import { useState, useRef, useEffect } from "react";
import { inputCls } from "../../styles/cls";

const ClienteSearch = ({ clientes, value, onChange }) => {
    const [query,     setQuery]     = useState("");
    const [abierto,   setAbierto]   = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const wrapRef = useRef(null);

    // Nombre del cliente seleccionado (para mostrar en el input)
    const nombreSeleccionado = value
        ? (clientes.find((c) => c._id === value)?.nombre || "")
        : "";

    const filtrados = query.length > 0
        ? clientes.filter((c) => c.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : clientes.slice(0, 8);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setAbierto(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const seleccionar = (cliente) => {
        onChange(cliente._id);
        setQuery("");
        setAbierto(false);
        setHighlight(-1);
    };

    const handleKey = (e) => {
        if (!abierto) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((p) => Math.min(p + 1, filtrados.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight((p) => Math.max(p - 1, 0)); }
        if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); seleccionar(filtrados[highlight]); }
        if (e.key === "Escape")    setAbierto(false);
    };

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cliente *</label>
            {/* Input de búsqueda — muestra el nombre si ya hay selección */}
            {value && !abierto ? (
                <button type="button" onClick={() => { setAbierto(true); setQuery(""); }}
                    className={`${inputCls} text-left w-full flex items-center justify-between`}>
                    <span className="truncate font-semibold text-slate-800">{nombreSeleccionado}</span>
                    <span className="text-xs text-blue-600 ml-2 shrink-0">Cambiar</span>
                </button>
            ) : (
                <input
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setAbierto(true); setHighlight(-1); }}
                    onFocus={() => setAbierto(true)}
                    onKeyDown={handleKey}
                    placeholder="Buscar cliente..."
                    className={inputCls}
                />
            )}
            {/* Dropdown */}
            {abierto && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    {filtrados.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400">Sin resultados.</p>
                    )}
                    {filtrados.map((c, i) => (
                        <button key={c._id} type="button"
                            onMouseDown={() => seleccionar(c)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                i === highlight ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-800"
                            }`}>
                            <span className="font-semibold">{c.nombre}</span>
                            {(c.direccion || c.localidad) && (
                                <span className="text-xs text-slate-400 ml-2">
                                    {c.direccion}{c.direccion && c.localidad ? " - " : ""}{c.localidad}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ClienteSearch;
