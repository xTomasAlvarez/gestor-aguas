import { useState } from "react";
import { useCallback, useEffect } from "react";
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente } from "../services/clienteService";
import Modal from "../components/Modal";
import { btnPrimary, btnSecondary, btnDanger } from "../styles/cls";

// ── Utilidad de teléfono ──────────────────────────────────────────────────
// Limpia el código de área (quita el 0 inicial) y el número (quita 15 inicial)
const limpiarArea  = (v) => v.replace(/\D/g, "").replace(/^0+/, "");
const limpiarNum   = (v) => v.replace(/\D/g, "").replace(/^15/, "");
// Arma el string internacional final: ej. 549381XXXXXXX
const armarTelefono = (prefijo, area, numero) => {
    const p = prefijo.replace(/\D/g, "");          // "549"
    const a = limpiarArea(area);
    const n = limpiarNum(numero);
    if (!a && !n) return "";
    return `${p}${a}${n}`;
};

// ── Componente de campo de teléfono ───────────────────────────────────────
const PREFIJOS = [
    { value: "549",  label: "+54 9 (AR movil)" },
    { value: "54",   label: "+54 (AR fijo)"    },
    { value: "598",  label: "+598 (UY)"         },
    { value: "591",  label: "+591 (BO)"         },
];

const TelInput = ({ value, onChange }) => {
    // value llega como string raw "5493811234567" o ""
    // Necesitamos descomponerlo para mostrarlo en los campos
    const [prefijo, setPrefijo] = useState("549");
    const [area,    setArea]    = useState("381");
    const [numero,  setNumero]  = useState("");

    // Al activar edición con valor existente, rellenar los campos
    useEffect(() => {
        if (value && value.length > 3) {
            // Intentamos extraer: prefijo conocido + área 3 dígitos + resto
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
    }, []);  // solo al montar

    const actualizar = (p, a, n) => {
        onChange(armarTelefono(p, a, n));
    };

    const inputSm = "px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";

    return (
        <div className="flex gap-2 items-center">
            {/* Prefijo país */}
            <select value={prefijo}
                onChange={(e) => { setPrefijo(e.target.value); actualizar(e.target.value, area, numero); }}
                className={`${inputSm} w-36 flex-shrink-0`}>
                {PREFIJOS.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
            {/* Código de área */}
            <input type="text" inputMode="numeric" maxLength={4}
                value={area} placeholder="Área"
                onChange={(e) => { const v = limpiarArea(e.target.value); setArea(v); actualizar(prefijo, v, numero); }}
                className={`${inputSm} w-20 flex-shrink-0`} />
            {/* Número */}
            <input type="text" inputMode="numeric" maxLength={10}
                value={numero} placeholder="Número"
                onChange={(e) => { const v = limpiarNum(e.target.value); setNumero(v); actualizar(prefijo, area, v); }}
                className={`${inputSm} flex-1 min-w-0`} />
        </div>
    );
};

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
    const handleTelChange = (tel) => {
        setForm((p) => ({ ...p, telefono: tel }));
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

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="nombre"    value={form.nombre}    onChange={handleChange} placeholder="Nombre *"   className={inputCls} />
                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Direccion"  className={inputCls} />
            </div>

            {/* Campo de teléfono dividido */}
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefono</p>
                <TelInput value={form.telefono} onChange={handleTelChange} />
                {form.telefono && (
                    <p className="text-xs text-slate-400 mt-1">
                        Numero internacional: <span className="font-mono text-slate-600">+{form.telefono}</span>
                    </p>
                )}
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
    const { nombre, direccion, telefono, deuda, saldo_pendiente = 0 } = cliente;
    const { bidones_20L = 0, bidones_12L = 0, sodas = 0 } = deuda || {};
    const tieneDeuda = bidones_20L > 0 || bidones_12L > 0 || sodas > 0 || saldo_pendiente > 0;

    // Formatear teléfono para mostrar (agrupa dígitos)
    const telDisplay = telefono
        ? `+${telefono.slice(0,2)} ${telefono.slice(2,5)} ${telefono.slice(5,8)}-${telefono.slice(8)}`
        : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">{nombre}</h2>
                    {direccion   && <p className="text-sm text-slate-500 mt-0.5">{direccion}</p>}
                    {telDisplay  && <a href={`tel:+${telefono}`} className="text-sm text-blue-600 hover:underline mt-0.5 block font-mono">{telDisplay}</a>}
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

            {saldo_pendiente > 0 && (
                <div className="bg-red-600 rounded-xl px-4 py-3 flex items-center justify-between">
                    <div>
                        <p className="text-xs font-semibold text-red-200 uppercase tracking-wider">Monto adeudado</p>
                        <p className="text-xl font-extrabold text-white mt-0.5">${saldo_pendiente.toLocaleString("es-AR")}</p>
                    </div>
                    <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="w-7 h-7 stroke-red-300">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
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

    const handleCrear    = async (form) => { const { data } = await crearCliente(form);                    setClientes((p) => [data, ...p]); };
    const handleEditar   = async (form) => { const { data } = await actualizarCliente(editando._id, form); setClientes((p) => p.map((c) => (c._id === data._id ? data : c))); setEditando(null); };
    const handleEliminar = async (id)   => { if (!window.confirm("Desactivar este cliente?")) return; await eliminarCliente(id); setClientes((p) => p.filter((c) => c._id !== id)); };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
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
