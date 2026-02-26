import { useState, useCallback, useEffect } from "react";
import {
    obtenerClientes, crearCliente, actualizarCliente, eliminarCliente,
    obtenerInactivos, toggleEstadoCliente,
} from "../services/clienteService";
import Modal        from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import toast        from "react-hot-toast";
import { btnPrimary, btnSecondary } from "../styles/cls";
import { RotateCcw, Archive } from "lucide-react";

// ── Utilidad de teléfono ──────────────────────────────────────────────────
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
        if (value && value.length > 3) {
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
    }, []);

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

// ── Formulario ────────────────────────────────────────────────────────────
const FORM_VACIO = { nombre: "", direccion: "", telefono: "" };

const FormCliente = ({ inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form,     setForm]     = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const handleChange    = (e)   => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(null); };
    const handleTelChange = (tel) => { setForm((p) => ({ ...p, telefono: tel })); setError(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
        setEnviando(true);
        try { await onGuardar(form); if (!esEdicion) setForm(FORM_VACIO); }
        catch (err) { setError(err.response?.data?.message || "Error al guardar el cliente."); }
        finally { setEnviando(false); }
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input name="nombre"    value={form.nombre}    onChange={handleChange} placeholder="Nombre *"  className={inputCls} />
                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Direccion" className={inputCls} />
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefono</p>
                <TelInput value={form.telefono} onChange={handleTelChange} />
                {form.telefono && (
                    <p className="text-xs text-slate-400 mt-1">Internacional: <span className="font-mono text-slate-600">+{form.telefono}</span></p>
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

// ── Tarjeta de cliente activo ─────────────────────────────────────────────
const ClienteCard = ({ cliente, onEditar, onDesactivar }) => {
    const { nombre, direccion, telefono, deuda, saldo_pendiente = 0 } = cliente;
    const { bidones_20L = 0, bidones_12L = 0, sodas = 0 } = deuda || {};
    const tieneDeuda = bidones_20L > 0 || bidones_12L > 0 || sodas > 0 || saldo_pendiente > 0;
    const telDisplay = telefono ? `+${telefono.slice(0,2)} ${telefono.slice(2,5)} ${telefono.slice(5,8)}-${telefono.slice(8)}` : null;

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col gap-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-2">
                <div>
                    <h2 className="text-base font-bold text-slate-800 leading-tight">{nombre}</h2>
                    {direccion  && <p className="text-sm text-slate-500 mt-0.5">{direccion}</p>}
                    {telDisplay && <a href={`tel:+${telefono}`} className="text-sm text-blue-600 hover:underline mt-0.5 block font-mono">{telDisplay}</a>}
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${tieneDeuda ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"}`}>
                    {tieneDeuda ? "Con deuda" : "Al dia"}
                </span>
            </div>
            <div className="border-t border-slate-100 pt-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Envases adeudados</p>
                <div className="grid grid-cols-3 gap-2">
                    {[{ label:"Bidon 20L", val:bidones_20L },{ label:"Bidon 12L", val:bidones_12L },{ label:"Sodas", val:sodas }].map(({label,val})=>(
                        <div key={label} className={`rounded-xl p-2.5 text-center ${val>0?"bg-red-50":"bg-slate-50"}`}>
                            <p className={`text-xl font-bold leading-none ${val>0?"text-red-600":"text-slate-400"}`}>{val}</p>
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
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                    </svg>
                </div>
            )}
            <div className="flex gap-2 pt-1 border-t border-slate-100">
                <button onClick={() => onEditar(cliente)} className={btnSecondary}>Editar</button>
                <button onClick={() => onDesactivar(cliente)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 transition-colors">
                    <Archive className="w-3.5 h-3.5" />
                    Desactivar
                </button>
            </div>
        </div>
    );
};

// ── Modal de clientes inactivos ───────────────────────────────────────────
const ModalInactivos = ({ onReactivar }) => {
    const [inactivos,  setInactivos]  = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [busqueda,   setBusqueda]   = useState("");
    const [procesando, setProcesando] = useState(null);

    const cargar = useCallback(async (nombre = "") => {
        try {
            setCargando(true);
            const { data } = await obtenerInactivos(nombre);
            setInactivos(data);
        } catch { toast.error("Error al cargar clientes inactivos."); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => cargar(busqueda), 350);
        return () => clearTimeout(t);
    }, [busqueda, cargar]);

    const handleReactivar = async (cliente) => {
        setProcesando(cliente._id);
        const tid = toast.loading(`Reactivando a ${cliente.nombre}...`);
        try {
            const { data } = await toggleEstadoCliente(cliente._id);
            toast.success(`${data.cliente.nombre} reactivado correctamente.`, { id: tid });
            setInactivos((prev) => prev.filter((c) => c._id !== cliente._id));
            onReactivar(data.cliente);
        } catch {
            toast.error("Error al reactivar el cliente.", { id: tid });
        } finally {
            setProcesando(null);
        }
    };

    return (
        <div className="flex flex-col gap-4">
            <input type="text" placeholder="Buscar inactivo..." value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm" />

            {cargando ? (
                <p className="text-center py-8 text-sm text-slate-400">Cargando...</p>
            ) : inactivos.length === 0 ? (
                <p className="text-center py-8 text-sm text-slate-400">No hay clientes inactivos.</p>
            ) : (
                <ul className="divide-y divide-slate-100 max-h-80 overflow-y-auto">
                    {inactivos.map((c) => (
                        <li key={c._id} className="py-3 flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                                <span className="text-sm font-bold text-slate-500">{c.nombre.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-600 truncate">{c.nombre}</p>
                                {c.direccion && <p className="text-xs text-slate-400 truncate">{c.direccion}</p>}
                            </div>
                            <button
                                onClick={() => handleReactivar(c)}
                                disabled={procesando === c._id}
                                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors">
                                <RotateCcw className="w-3.5 h-3.5" />
                                {procesando === c._id ? "..." : "Reactivar"}
                            </button>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

// ── Página principal ──────────────────────────────────────────────────────
const ClientesPage = () => {
    const [clientes,       setClientes]       = useState([]);
    const [busqueda,       setBusqueda]       = useState("");
    const [cargando,       setCargando]       = useState(true);
    const [error,          setError]          = useState(null);
    const [editando,       setEditando]       = useState(null);
    const [modalInactivos, setModalInactivos] = useState(false);
    const [confirmarDesact,setConfirmarDesact] = useState(null); // cliente a desactivar

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

    const handleCrear = async (form) => {
        const tid = toast.loading("Guardando cliente...");
        try {
            const { data } = await crearCliente(form);
            setClientes((p) => [data, ...p]);
            toast.success("Cliente creado correctamente.", { id: tid });
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al crear el cliente.", { id: tid });
            throw err;
        }
    };

    const handleEditar = async (form) => {
        const tid = toast.loading("Actualizando...");
        try {
            const { data } = await actualizarCliente(editando._id, form);
            setClientes((p) => p.map((c) => (c._id === data._id ? data : c)));
            setEditando(null);
            toast.success("Cliente actualizado.", { id: tid });
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al actualizar.", { id: tid });
            throw err;
        }
    };

    const handleDesactivar = async () => {
        const cliente = confirmarDesact;
        const tid = toast.loading("Desactivando...");
        try {
            await eliminarCliente(cliente._id);
            setClientes((p) => p.filter((c) => c._id !== cliente._id));
            toast.success(`${cliente.nombre} desactivado correctamente.`, { id: tid });
        } catch {
            toast.error("Error al desactivar el cliente.", { id: tid });
        }
    };

    // Cuando se reactiva desde el modal, lo agregamos a la lista activa
    const handleReactivar = (clienteReactivado) => {
        setClientes((p) => [clienteReactivado, ...p].sort((a, b) => a.nombre.localeCompare(b.nombre)));
    };

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
            <div className="max-w-6xl mx-auto mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Clientes</h1>
                    <p className="text-sm text-slate-500 mt-1">Administracion de clientes activos.</p>
                </div>
                <button onClick={() => setModalInactivos(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-slate-300 transition-colors shadow-sm">
                    <Archive className="w-4 h-4" />
                    <span className="hidden sm:inline">Ver inactivos</span>
                </button>
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
            {!cargando && !error && clientes.length === 0 && <p className="max-w-6xl mx-auto text-center py-16 text-slate-400">No se encontraron clientes activos.</p>}
            {!cargando && !error && clientes.length > 0 && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientes.map((c) => (
                        <ClienteCard key={c._id} cliente={c} onEditar={setEditando}
                            onDesactivar={(cli) => setConfirmarDesact(cli)} />
                    ))}
                </div>
            )}

            {/* Modal edición */}
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

            {/* Modal inactivos */}
            <Modal isOpen={modalInactivos} onClose={() => setModalInactivos(false)} title="Clientes inactivos">
                <ModalInactivos onReactivar={handleReactivar} />
            </Modal>

            <ConfirmModal
                isOpen={!!confirmarDesact}
                onClose={() => setConfirmarDesact(null)}
                onConfirm={handleDesactivar}
                title="Desactivar cliente"
                message={confirmarDesact ? `¿Desactivar a "${confirmarDesact.nombre}"? Lo podrás reactivar desde el panel de inactivos.` : ""}
                confirmLabel="Desactivar"
                type="danger"
            />
        </div>
    );
};

export default ClientesPage;
