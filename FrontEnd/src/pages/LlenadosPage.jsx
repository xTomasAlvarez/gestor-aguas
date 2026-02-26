import { useState } from "react";
import { obtenerLlenados, crearLlenado, actualizarLlenado, eliminarLlenado } from "../services/llenadoService";
import useListaCrud from "../hooks/useListaCrud";
import FiltroTiempo from "../components/FiltroTiempo";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { formatPeso, groupByDay, formatFechaDia, filtrarPorTiempo, FILTRO_CONFIG } from "../utils/format";
import { inputCls, btnPrimary, btnSecondary } from "../styles/cls";
import { useConfig } from "../context/ConfigContext";

// Conversores form ↔ modelo
const llenadoToForm = (l, catProductos) => {
    const cantidades = {};
    catProductos.forEach(p => { cantidades[p.key] = 0; });
    l.productos.forEach(({ producto, cantidad }) => { cantidades[producto] = cantidad; });
    return { cantidades, costo_total: l.costo_total ?? "", fecha: l.fecha ? l.fecha.split("T")[0] : hoy() };
};

const formToPayload = ({ cantidades, costo_total, fecha }, catProductos) => ({
    productos: catProductos
        .filter(({ key }) => Number(cantidades[key]) > 0)
        .map(({ key }) => ({ producto: key, cantidad: Number(cantidades[key]) })),
    ...(costo_total !== "" && { costo_total: Number(costo_total) }),
    ...(fecha && { fecha }),
});

// ── Formulario ────────────────────────────────────────────────────────────
const hoy = () => new Date().toISOString().slice(0, 10);

// Stepper táctil: fila con label a la izq y controles a la der
const Stepper = ({ label, value, onChange }) => (
    <div className="flex items-center justify-between bg-slate-50 rounded-2xl px-4 py-3 sm:flex-col sm:items-center sm:py-4">
        <span className="text-sm font-bold text-slate-700 sm:text-xs sm:uppercase sm:tracking-wider sm:mb-2">{label}</span>
        <div className="flex items-center gap-1">
            <button
                type="button"
                onClick={() => onChange(Math.max(0, Number(value) - 1))}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-slate-200 hover:bg-slate-300 active:bg-slate-400 text-slate-700 text-2xl font-bold transition-colors touch-manipulation select-none"
            >−</button>
            <input
                type="number"
                inputMode="numeric"
                min="0"
                value={value === 0 ? "" : value}
                onChange={(e) => {
                    const v = e.target.value;
                    onChange(v === "" ? 0 : Math.max(0, Number(v) || 0));
                }}
                onBlur={(e) => { if (e.target.value === "") onChange(0); }}
                placeholder="0"
                className="w-12 text-center text-2xl font-extrabold text-slate-900 tabular-nums bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-0"
            />
            <button
                type="button"
                onClick={() => onChange(Number(value) + 1)}
                className="w-11 h-11 flex items-center justify-center rounded-xl bg-blue-700 hover:bg-blue-800 active:bg-blue-900 text-white text-2xl font-bold transition-colors touch-manipulation select-none"
            >+</button>
        </div>
    </div>
);

const FormLlenado = ({ envaseConfig = [], inicial, onGuardar, onCancelar, esEdicion = false }) => {
    const defaultCantidades = {};
    envaseConfig.forEach(p => { defaultCantidades[p.key] = 0; });

    const [form, setForm]         = useState(inicial || { cantidades: defaultCantidades, costo_total: "", fecha: hoy() });
    const [enviando, setEnviando] = useState(false);
    const [error, setError]       = useState(null);

    const setCantidad = (key, val) =>
        setForm((p) => ({ ...p, cantidades: { ...p.cantidades, [key]: val } }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null);
        const payload = formToPayload(form, envaseConfig);
        if (!payload.productos.length) return setError("Ingresa al menos un producto.");
        setEnviando(true);
        try { 
            await onGuardar(payload); 
            if (!esEdicion) setForm({ cantidades: defaultCantidades, costo_total: "", fecha: hoy() }); 
        }
        catch (err) { setError(err.response?.data?.message || "Error al guardar."); }
        finally { setEnviando(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha del registro</label>
                <input type="date" value={form.fecha} max={hoy()}
                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                    className={`${inputCls} sm:w-48`} />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unidades a cargar</p>
                {/* Mobile: 1 columna full con steppers en fila. sm+: 3 columnas */}
                <div className="flex flex-col gap-2 sm:grid sm:grid-cols-3 sm:gap-3">
                    {envaseConfig.map(({ key, label }) => (
                        <Stepper key={key} label={label}
                            value={form.cantidades[key] || 0}
                            onChange={(v) => setCantidad(key, v)} />
                    ))}
                </div>
            </div>

            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo total</label>
                <input type="number" inputMode="numeric" min="0" value={form.costo_total}
                    onChange={(e) => setForm((p) => ({ ...p, costo_total: e.target.value }))}
                    placeholder="Ej: 45000" className={`${inputCls} sm:w-48`} />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar" : "Registrar carga"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};


// ── Accordion de días ─────────────────────────────────────────────────────
const LlenadoFila = ({ llenado, onEditar, onEliminar }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
        <div className="flex flex-wrap gap-1.5">
            {llenado.productos.map((p, i) => (
                <span key={i} className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                    {p.cantidad} {p.producto}
                </span>
            ))}
            {llenado.costo_total != null && (
                <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full">{formatPeso(llenado.costo_total)}</span>
            )}
        </div>
        <div className="flex items-center gap-2 shrink-0 ml-2">
            <button onClick={() => onEditar(llenado)} className="text-xs text-blue-600 hover:underline">Editar</button>
            <button onClick={() => onEliminar(llenado._id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
        </div>
    </div>
);

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onEliminar }) => {
    const totales = items.reduce((acc, l) => {
        l.productos.forEach(({ producto, cantidad }) => { acc[producto] = (acc[producto] || 0) + cantidad; });
        return acc;
    }, {});

    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => onToggle(diaKey)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
                <div>
                    <p className="text-sm font-bold text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                    <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? "carga" : "cargas"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                        {Object.entries(totales).map(([p, c]) => (
                            <span key={p} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{c} {p}</span>
                        ))}
                    </div>
                    <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
                </div>
            </button>
            {expanded && (
                <div className="px-5 pb-3 border-t border-slate-100">
                    {items.map((l) => <LlenadoFila key={l._id} llenado={l} onEditar={onEditar} onEliminar={onEliminar} />)}
                </div>
            )}
        </div>
    );
};

// ── Página principal ──────────────────────────────────────────────────────
const LlenadosPage = () => {
    const { config } = useConfig();
    const productosBase = config?.productos || [];

    const { items: llenados, cargando, error, agregar, actualizar, eliminar: eliminarLocal } =
        useListaCrud(() => obtenerLlenados().then((r) => r.data));

    const [filtroTiempo, setFiltroTiempo] = useState("hoy");
    const [expanded,     setExpanded]     = useState(new Set());
    const [editando,     setEditando]     = useState(null);
    const [confirmar,    setConfirmar]    = useState(null); // { id }

    const handleFiltro = (val) => { setFiltroTiempo(val); setExpanded(new Set()); };
    const toggleDia = (key) => setExpanded((p) => {
        const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleCrear  = async (payload) => { const { data } = await crearLlenado(payload); agregar(data); };
    const handleEditar = async (payload) => {
        const { data } = await actualizarLlenado(editando._id, payload);
        actualizar(data); setEditando(null);
    };
    const handleEliminar = async () => {
        const { id } = confirmar;
        await eliminarLlenado(id);
        eliminarLocal(id);
        toast.success("Llenado eliminado correctamente.");
    };

    const filtrados  = filtrarPorTiempo(llenados, filtroTiempo);
    const porDia     = groupByDay(filtrados);
    const dias       = Object.keys(porDia).sort().reverse();
    const labelCorto = FILTRO_CONFIG.find((f) => f.value === filtroTiempo)?.labelCorto || "";
    const acumulado  = filtrados.reduce((acc, l) => {
        l.productos.forEach(({ producto, cantidad }) => { acc[producto] = (acc[producto] || 0) + cantidad; });
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-3xl mx-auto mb-6">
                <h1 className="text-2xl font-extrabold text-slate-800">Llenados</h1>
                <p className="text-sm text-slate-500 mt-1">Registro de cargas de la camioneta.</p>
            </div>

            <div className="max-w-3xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {productosBase.map(({ key, label }) => (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-center">
                        <p className="text-2xl font-extrabold text-slate-800">{acumulado[key] || 0}</p>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-1 capitalize">{labelCorto}</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Registrar carga</h2>
                <FormLlenado envaseConfig={productosBase} onGuardar={handleCrear} />
            </div>

            <div className="max-w-3xl mx-auto flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700">
                    Historial <span className="ml-2 text-sm font-normal text-slate-400">({filtrados.length} registros)</span>
                </h2>
                <FiltroTiempo valor={filtroTiempo} onChange={handleFiltro} />
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-2">
                {cargando && <p className="text-center py-16 text-slate-400">Cargando...</p>}
                {error && !cargando && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>}
                {!cargando && !error && dias.length === 0 && <p className="text-center py-16 text-slate-400">Sin registros para este periodo.</p>}
                {!cargando && !error && dias.map((dk) => (
                    <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                        expanded={expanded.has(dk)} onToggle={toggleDia}
                        onEditar={setEditando}
                        onEliminar={(id) => setConfirmar({ id })} />
                ))}
            </div>

            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar llenado">
                {editando && (
                    <FormLlenado envaseConfig={productosBase} inicial={llenadoToForm(editando, productosBase)}
                        onGuardar={handleEditar} onCancelar={() => setEditando(null)} esEdicion />
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!confirmar}
                onClose={() => setConfirmar(null)}
                onConfirm={handleEliminar}
                title="Eliminar llenado"
                message="¿Eliminar este llenado? Esta acción no se puede deshacer."
                confirmLabel="Eliminar"
            />
        </div>
    );
};

export default LlenadosPage;
