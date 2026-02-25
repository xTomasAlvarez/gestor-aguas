import { useState, useEffect } from "react";
import { obtenerLlenados, crearLlenado, actualizarLlenado, eliminarLlenado } from "../services/llenadoService";
import Modal from "../components/Modal";
import { MESES, formatFecha, formatPeso, filterByMonth, groupByDay, getAvailableYears, formatFechaDia } from "../utils/format";

const inputCls   = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";
const btnPrimary = "px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors";
const btnSecondary = "px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 border border-slate-200 rounded-xl hover:border-blue-400 transition-colors";

const PRODUCTOS = [
    { key: "Bidon 20L", label: "Bidon 20L" },
    { key: "Bidon 12L", label: "Bidon 12L" },
    { key: "Soda",      label: "Soda"      },
];

const CANT_VACIO = { "Bidon 20L": 0, "Bidon 12L": 0, "Soda": 0 };

// Convierte un llenado guardado al formato del form
const llenadoToForm = (llenado) => {
    const cantidades = { ...CANT_VACIO };
    llenado.productos.forEach(({ producto, cantidad }) => { cantidades[producto] = cantidad; });
    return { cantidades, costo_total: llenado.costo_total ?? "" };
};

// Convierte el form al payload del backend
const formToPayload = (form) => {
    const productos = PRODUCTOS
        .filter(({ key }) => Number(form.cantidades[key]) > 0)
        .map(({ key }) => ({ producto: key, cantidad: Number(form.cantidades[key]) }));
    return {
        productos,
        ...(form.costo_total !== "" && { costo_total: Number(form.costo_total) }),
    };
};

// ── Formulario crear/editar ────────────────────────────────────────────────
const FORM_VACIO = { cantidades: { ...CANT_VACIO }, costo_total: "" };

const FormLlenado = ({ inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form,     setForm]     = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const setCantidad = (key, val) =>
        setForm((p) => ({ ...p, cantidades: { ...p.cantidades, [key]: val } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        const payload = formToPayload(form);
        if (payload.productos.length === 0) return setError("Ingresa al menos un producto.");
        setEnviando(true);
        try {
            await onGuardar(payload);
            if (!esEdicion) setForm(FORM_VACIO);
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Unidades cargadas</p>
                <div className="grid grid-cols-3 gap-3">
                    {PRODUCTOS.map(({ key, label }) => (
                        <div key={key} className="flex flex-col items-center gap-2 bg-slate-50 rounded-xl px-3 py-4">
                            <span className="text-xs font-semibold text-slate-600 text-center">{label}</span>
                            <input
                                type="number" min="0"
                                value={form.cantidades[key]}
                                onChange={(e) => setCantidad(key, e.target.value)}
                                className="w-full text-center px-2 py-2 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold text-xl focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
                            />
                        </div>
                    ))}
                </div>
            </div>
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo total (opcional)</label>
                <input
                    type="number" min="0"
                    value={form.costo_total}
                    onChange={(e) => setForm((p) => ({ ...p, costo_total: e.target.value }))}
                    placeholder="Ej: 45000"
                    className={`${inputCls} sm:w-48`}
                />
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

// ── Selector de mes/año ───────────────────────────────────────────────────
const MonthSelector = ({ month, year, onMonth, onYear }) => (
    <div className="flex gap-2">
        <select value={month} onChange={(e) => onMonth(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {MESES.map((m, i) => <option key={i} value={i}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => onYear(Number(e.target.value))}
            className="px-3 py-2 rounded-xl border border-slate-200 text-sm text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            {getAvailableYears().map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
    </div>
);

// ── Accordion de días ─────────────────────────────────────────────────────
const LlenadoFila = ({ llenado, onEditar, onEliminar }) => {
    const total = llenado.productos.reduce((acc, p) => acc + p.cantidad, 0);
    return (
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
                <span className="text-xs text-slate-400">{total} uds.</span>
                <button onClick={() => onEditar(llenado)} className="text-xs text-blue-600 hover:underline">Editar</button>
                <button onClick={() => onEliminar(llenado._id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
            </div>
        </div>
    );
};

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onEliminar }) => {
    const totalesDia = items.reduce((acc, l) => {
        l.productos.forEach(({ producto, cantidad }) => {
            acc[producto] = (acc[producto] || 0) + cantidad;
        });
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
                        {Object.entries(totalesDia).map(([prod, cant]) => (
                            <span key={prod} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{cant} {prod}</span>
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
    const now = new Date();
    const [llenados, setLlenados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);
    const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
    const [selectedYear,  setSelectedYear]  = useState(now.getFullYear());
    const [expanded,  setExpanded]  = useState(new Set());
    const [editando,  setEditando]  = useState(null);

    const cargarLlenados = async () => {
        try { setCargando(true); const { data } = await obtenerLlenados(); setLlenados(data); }
        catch { setError("No se pudo conectar con el servidor."); }
        finally { setCargando(false); }
    };

    useEffect(() => { cargarLlenados(); }, []);

    const toggleDia = (key) => setExpanded((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const handleCrear = async (payload) => {
        const { data } = await crearLlenado(payload);
        setLlenados((p) => [data, ...p]);
    };

    const handleEditar = async (payload) => {
        const { data } = await actualizarLlenado(editando._id, payload);
        setLlenados((p) => p.map((l) => (l._id === data._id ? data : l)));
        setEditando(null);
    };

    const handleEliminar = async (id) => {
        if (!window.confirm("Eliminar este llenado?")) return;
        await eliminarLlenado(id);
        setLlenados((p) => p.filter((l) => l._id !== id));
    };

    const filtrados = filterByMonth(llenados, selectedMonth, selectedYear);
    const porDia    = groupByDay(filtrados);
    const dias      = Object.keys(porDia).sort().reverse();

    // Resumen acumulado del mes
    const acumulado = filtrados.reduce((acc, l) => {
        l.productos.forEach(({ producto, cantidad }) => { acc[producto] = (acc[producto] || 0) + cantidad; });
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-3xl mx-auto mb-6">
                <h1 className="text-2xl font-extrabold text-slate-800">Llenados</h1>
                <p className="text-sm text-slate-500 mt-1">Registro de cargas de la camioneta.</p>
            </div>

            {/* Resumen del mes */}
            <div className="max-w-3xl mx-auto grid grid-cols-3 gap-3 mb-6">
                {PRODUCTOS.map(({ key, label }) => (
                    <div key={key} className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-center">
                        <p className="text-2xl font-extrabold text-slate-800">{acumulado[key] || 0}</p>
                        <p className="text-xs text-slate-400 uppercase tracking-wider mt-1">Este mes</p>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium">{label}</p>
                    </div>
                ))}
            </div>

            {/* Formulario */}
            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Registrar carga</h2>
                <FormLlenado onGuardar={handleCrear} />
            </div>

            {/* Historial */}
            <div className="max-w-3xl mx-auto flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700">
                    Historial
                    <span className="ml-2 text-sm font-normal text-slate-400">({filtrados.length} registros)</span>
                </h2>
                <MonthSelector month={selectedMonth} year={selectedYear} onMonth={setSelectedMonth} onYear={setSelectedYear} />
            </div>

            <div className="max-w-3xl mx-auto flex flex-col gap-2">
                {cargando && <p className="text-center py-16 text-slate-400">Cargando...</p>}
                {error && !cargando && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>}
                {!cargando && !error && dias.length === 0 && <p className="text-center py-16 text-slate-400">Sin registros para este mes.</p>}
                {!cargando && !error && dias.map((dk) => (
                    <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                        expanded={expanded.has(dk)} onToggle={toggleDia}
                        onEditar={setEditando} onEliminar={handleEliminar} />
                ))}
            </div>

            {/* Modal de edicion */}
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar llenado">
                {editando && (
                    <FormLlenado
                        inicial={llenadoToForm(editando)}
                        onGuardar={handleEditar}
                        onCancelar={() => setEditando(null)}
                        esEdicion
                    />
                )}
            </Modal>
        </div>
    );
};

export default LlenadosPage;
