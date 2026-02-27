import { useState } from "react";
import { obtenerGastos, crearGasto, actualizarGasto, eliminarGasto } from "../services/gastosService";
import useListaCrud from "../hooks/useListaCrud";
import FiltroTiempo from "../components/FiltroTiempo";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { formatFecha, formatPeso, groupByDay, formatFechaDia, filtrarPorTiempo, FILTRO_CONFIG, hoyLocal, isoToInputDate, prepararFechaBackend } from "../utils/format";
import { inputCls, btnPrimary, btnSecondary } from "../styles/cls";

// ── Formulario crear/editar ────────────────────────────────────────────────
const FORM_VACIO = { concepto: "", monto: "", fecha: hoyLocal() };

const FormGasto = ({ inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form, setForm]         = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error, setError]       = useState(null);

    const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.concepto.trim()) return setError("El concepto es obligatorio.");
        if (!form.monto || Number(form.monto) <= 0) return setError("El monto debe ser mayor a 0.");
        if (form.fecha > hoyLocal()) return setError("No se pueden registrar fechas futuras.");
        setEnviando(true);
        try {
            await onGuardar({ concepto: form.concepto.trim(), monto: Number(form.monto), fecha: prepararFechaBackend(form.fecha) });
            if (!esEdicion) setForm(FORM_VACIO);
        } catch (err) { setError(err.response?.data?.message || "Error al guardar."); }
        finally { setEnviando(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha del registro</label>
                <input name="fecha" type="date" value={form.fecha} max={hoyLocal()}
                    onChange={handleChange} className={`${inputCls} sm:w-48`} />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-3">
                <input name="concepto" value={form.concepto} onChange={handleChange} placeholder="Concepto *" className={inputCls} />
                <input name="monto" type="number" min="0" value={form.monto} onChange={handleChange} placeholder="Monto *" className={`${inputCls} sm:w-36`} />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar" : "Registrar gasto"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};

// ── Accordion de días ─────────────────────────────────────────────────────
const GastoFila = ({ gasto, onEditar, onEliminar }) => (
    <div className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
        <div>
            <p className="text-sm font-semibold text-slate-800">{gasto.concepto}</p>
            <p className="text-xs text-slate-400">{formatFecha(gasto.fecha)}</p>
        </div>
        <div className="flex items-center gap-3">
            <p className="text-sm font-bold text-slate-800">{formatPeso(gasto.monto)}</p>
            <button onClick={() => onEditar(gasto)} className="text-xs text-blue-600 hover:underline">Editar</button>
            <button onClick={() => onEliminar(gasto._id)} className="text-xs text-red-500 hover:underline">Eliminar</button>
        </div>
    </div>
);

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onEliminar }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => onToggle(diaKey)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors text-left">
            <div>
                <p className="text-sm font-bold text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? "gasto" : "gastos"}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-slate-700">{formatPeso(items.reduce((a, g) => a + g.monto, 0))}</p>
                <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
            </div>
        </button>
        {expanded && (
            <div className="px-5 pb-3 border-t border-slate-100">
                {items.map((g) => <GastoFila key={g._id} gasto={g} onEditar={onEditar} onEliminar={onEliminar} />)}
            </div>
        )}
    </div>
);

// ── Página principal ──────────────────────────────────────────────────────
const GastosPage = () => {
    const { items: gastos, cargando, error, agregar, actualizar, eliminar: eliminarLocal } =
        useListaCrud(() => obtenerGastos().then((r) => r.data));

    const [filtroTiempo, setFiltroTiempo] = useState("hoy");
    const [expanded,     setExpanded]     = useState(new Set());
    const [editando,     setEditando]     = useState(null);
    const [confirmar,    setConfirmar]    = useState(null); // { id, nombre }

    const handleFiltro = (val) => { setFiltroTiempo(val); setExpanded(new Set()); };
    const toggleDia = (key) => setExpanded((p) => {
        const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleCrear  = async (form) => { const { data } = await crearGasto(form); agregar(data); };
    const handleEditar = async (form) => {
        const { data } = await actualizarGasto(editando._id, form);
        actualizar(data); setEditando(null);
    };
    const handleEliminar = async () => {
        const { id, nombre } = confirmar;
        await eliminarGasto(id);
        eliminarLocal(id);
        toast.success(`"${nombre}" eliminado correctamente.`);
    };

    const filtrados    = filtrarPorTiempo(gastos, filtroTiempo);
    const porDia       = groupByDay(filtrados);
    const dias         = Object.keys(porDia).sort().reverse();
    const totalPeriodo = filtrados.reduce((a, g) => a + g.monto, 0);
    const labelCorto   = FILTRO_CONFIG.find((f) => f.value === filtroTiempo)?.labelCorto || "";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-3xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Gastos</h1>
                    <p className="text-sm text-slate-500 mt-1">Registro de gastos operativos.</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl px-4 py-3 shadow-sm text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total {labelCorto}</p>
                    <p className="text-xl font-extrabold text-slate-800">{formatPeso(totalPeriodo)}</p>
                </div>
            </div>

            <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Nuevo gasto</h2>
                <FormGasto onGuardar={handleCrear} />
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
                {/* Eliminar item en cada fila → pasamos setConfirmar */}
            {!cargando && !error && dias.map((dk) => (
                <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                    expanded={expanded.has(dk)} onToggle={toggleDia}
                    onEditar={setEditando}
                    onEliminar={(id) => {
                        const g = gastos.find((x) => x._id === id);
                        setConfirmar({ id, nombre: g?.concepto || "Gasto" });
                    }} />
            ))}
        </div>

        <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar gasto">
            {editando && (
                <FormGasto
                    inicial={{ concepto: editando.concepto, monto: editando.monto, fecha: isoToInputDate(editando.fecha) }}
                    onGuardar={handleEditar} onCancelar={() => setEditando(null)} esEdicion />
            )}
        </Modal>

        <ConfirmModal
            isOpen={!!confirmar}
            onClose={() => setConfirmar(null)}
            onConfirm={handleEliminar}
            title="Eliminar gasto"
            message={confirmar ? `¿Eliminar "${confirmar.nombre}"? Esta acción no se puede deshacer.` : ""}
            confirmLabel="Eliminar"
        />
    </div>
    );
};

export default GastosPage;
