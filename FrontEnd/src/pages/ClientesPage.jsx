import { useState } from "react";
import { useCallback, useEffect } from "react";
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from "../services/clienteService";
import Modal from "../components/Modal";
import { inputCls, btnPrimary, btnSecondary, btnDanger } from "../styles/cls";

// ── Formulario ────────────────────────────────────────────────────────────
const FORM_VACIO = { nombre: "", direccion: "", telefono: "" };

const FormCliente = ({ inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form, setForm]         = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error, setError]       = useState(null);

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
        setEnviando(true);
        try {
            await onGuardar(form);
            if (!esEdicion) setForm(FORM_VACIO);
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar el cliente.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <input name="nombre"    value={form.nombre}    onChange={handleChange} placeholder="Nombre *"  className={inputCls} />
                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Dirección" className={inputCls} />
                <input name="telefono"  value={form.telefono}  onChange={handleChange} placeholder="Teléfono"  className={inputCls} />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar" : "Guardar cliente"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};

// ── Tarjeta de cliente ────────────────────────────────────────────────────
const ClienteCard = ({ cliente, onEditar, onEliminar }) => {
    const { nombre, direccion, telefono, deuda } = cliente;
    const { bidones_20L = 0, bidones_12L = 0, sodas = 0, saldo = 0 } = deuda || {};
    const tieneDeuda = bidones_20L > 0 || bidones_12L > 0 || sodas > 0 || saldo > 0;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">{nombre}</h2>
                    {direccion && <p className="text-sm text-slate-500 mt-0.5">{direccion}</p>}
                    {telefono  && <a href={`tel:${telefono}`} className="text-sm text-blue-600 hover:underline mt-0.5 block">{telefono}</a>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${
                    tieneDeuda ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
                }`}>
                    {tieneDeuda ? "Con deuda" : "Al dia"}
                </span>
            </div>

            <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Envases adeudados</p>
                <div className="grid grid-cols-3 gap-2">
                    {[
                        { label: "Bidon 20L", val: bidones_20L },
                        { label: "Bidon 12L", val: bidones_12L },
                        { label: "Sodas",     val: sodas },
                    ].map(({ label, val }) => (
                        <div key={label} className={`rounded-xl p-2.5 text-center ${val > 0 ? "bg-red-50" : "bg-slate-50"}`}>
                            <p className={`text-xl font-bold leading-none ${val > 0 ? "text-red-600" : "text-slate-400"}`}>{val}</p>
                            <p className="text-[10px] text-slate-500 mt-1">{label}</p>
                        </div>
                    ))}
                </div>
            </div>

            {saldo > 0 && (
                <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-2.5 flex items-center justify-between">
                    <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Deuda monetaria</p>
                    <p className="text-sm font-extrabold text-red-700">${saldo.toLocaleString("es-AR")}</p>
                </div>
            )}

            <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => onEditar(cliente)} className={btnSecondary}>Editar</button>
                <button onClick={() => onEliminar(cliente._id)} className={btnDanger}>Desactivar</button>
            </div>
        </div>
    );
};

// ── Página principal ──────────────────────────────────────────────────────
const ClientesPage = () => {
    const [clientes, setClientes] = useState([]);
    const [busqueda, setBusqueda] = useState("");
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);
    const [editando, setEditando] = useState(null);

    const cargar = useCallback(async (nombre = "") => {
        try {
            setCargando(true); setError(null);
            const { data } = await obtenerClientes(nombre);
            setClientes(data);
        } catch { setError("No se pudo conectar con el servidor."); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => cargar(busqueda), 350);
        return () => clearTimeout(t);
    }, [busqueda, cargar]);

    const handleCrear  = async (form) => {
        const { data } = await crearCliente(form);
        setClientes((p) => [data, ...p]);
    };
    const handleEditar = async (form) => {
        const { data } = await actualizarCliente(editando._id, form);
        setClientes((p) => p.map((c) => (c._id === data._id ? data : c)));
        setEditando(null);
    };
    const handleEliminar = async (id) => {
        if (!window.confirm("Desactivar este cliente?")) return;
        await eliminarCliente(id);
        setClientes((p) => p.filter((c) => c._id !== id));
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-6xl mx-auto mb-6">
                <h1 className="text-2xl font-extrabold text-slate-800">Clientes</h1>
                <p className="text-sm text-slate-500 mt-1">Administracion de clientes activos.</p>
            </div>

            <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Nuevo cliente</h2>
                <FormCliente onGuardar={handleCrear} />
            </div>

            <div className="max-w-6xl mx-auto mb-5">
                <input type="text" placeholder="Buscar por nombre..." value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full sm:w-72 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm" />
            </div>

            {cargando && <p className="max-w-6xl mx-auto text-center py-16 text-slate-400">Cargando clientes...</p>}
            {error && !cargando && <div className="max-w-6xl mx-auto bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>}
            {!cargando && !error && clientes.length === 0 && <p className="max-w-6xl mx-auto text-center py-16 text-slate-400">No se encontraron clientes.</p>}
            {!cargando && !error && clientes.length > 0 && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientes.map((c) => (
                        <ClienteCard key={c._id} cliente={c} onEditar={setEditando} onEliminar={handleEliminar} />
                    ))}
                </div>
            )}

            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar cliente">
                {editando && (
                    <FormCliente
                        inicial={{ nombre: editando.nombre, direccion: editando.direccion || "", telefono: editando.telefono || "" }}
                        onGuardar={handleEditar}
                        onCancelar={() => setEditando(null)}
                        esEdicion
                    />
                )}
            </Modal>
        </div>
    );
};

export default ClientesPage;
