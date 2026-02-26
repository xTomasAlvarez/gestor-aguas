import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import { 
    listarUsuarios, toggleActivo, eliminarUsuario, 
    obtenerEmpresa, crearEmpresa, regenerarCodigo,
    actualizarIdentidad, actualizarCatalogo
} from "../services/adminService";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";
import { inputCls, btnPrimary } from "../styles/cls";

// ── Componentes auxiliares ────────────────────────────────────────────────
const EstadoBadge = ({ activo }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        activo ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${activo ? "bg-emerald-500" : "bg-amber-500"}`} />
        {activo ? "Activo" : "Pendiente"}
    </span>
);

const RolBadge = ({ rol }) => (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
        rol === "admin" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-600"
    }`}>
        {rol === "admin" ? "Admin" : "Empleado"}
    </span>
);

// ── Tab: Identidad de la Empresa ──────────────────────────────────────────
const TabIdentidad = ({ empresa, setEmpresa }) => {
    const { config, recargarConfig } = useConfig();
    const [form, setForm] = useState({ 
        nombre: config?.nombre || "", 
        telefono: config?.telefono || "", 
        logo: config?.logo || "" 
    });
    const [cargando, setCargando] = useState(false);
    const [confirmarRegen, setConfirmarRegen] = useState(false);
    const [regenCargando, setRegenCargando] = useState(false);
    const [copiado, setCopiado] = useState(false);

    // Sincronizar local state cuando cambia config
    useEffect(() => {
        setForm({ 
            nombre: config?.nombre || "", 
            telefono: config?.telefono || "", 
            logo: config?.logo || "" 
        });
    }, [config]);

    const handleGuardar = async (e) => {
        e.preventDefault();
        setCargando(true);
        try {
            await actualizarIdentidad({ 
                nombre: form.nombre.trim(), 
                telefono: form.telefono.trim(), 
                logo: form.logo.trim() 
            });
            await recargarConfig();
            toast.success("Identidad actualizada correctamente");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al actualizar");
        } finally {
            setCargando(false);
        }
    };

    const copiarCodigo = () => {
        if (!empresa?.codigoVinculacion) return;
        navigator.clipboard.writeText(empresa.codigoVinculacion)
            .then(() => { setCopiado(true); setTimeout(() => setCopiado(false), 2000); });
    };

    const handleRegenerarCodigo = async () => {
        setRegenCargando(true);
        try {
            const { data } = await regenerarCodigo();
            setEmpresa(data);
            setCopiado(false);
            setConfirmarRegen(false);
            toast.success("Nuevo código generado correctamente.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al regenerar el código.");
        } finally {
            setRegenCargando(false);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
                <h2 className="text-base font-bold text-slate-800 mb-4">Perfil Público</h2>
                <form onSubmit={handleGuardar} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Nombre Comercial</label>
                            <input type="text" value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} className={inputCls} placeholder="Ej: Aguas Delicia" required />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Logo URL</label>
                            <input type="url" value={form.logo} onChange={e => setForm(p => ({ ...p, logo: e.target.value }))} className={inputCls} placeholder="https://ejemplo.com/logo.png" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Teléfono (WhatsApp)</label>
                            <input type="text" value={form.telefono} onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} className={inputCls} placeholder="Ej: +54 9 351 ..." />
                        </div>
                    </div>
                    <div className="flex justify-end mt-2">
                        <button type="submit" disabled={cargando} className={btnPrimary}>
                            {cargando ? "Guardando..." : "Guardar cambios"}
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
                <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-800">Código de vinculación</h2>
                        <p className="text-xs text-slate-400 mt-0.5">
                            Compartí este código con tus empleados para que se agreguen a tu cuenta.
                        </p>
                    </div>
                    <button onClick={() => setConfirmarRegen(true)} disabled={regenCargando}
                        className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50">
                        {regenCargando ? "Generando..." : "Generar nuevo"}
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center">
                        <span className="text-2xl font-extrabold tracking-widest text-slate-800 font-mono">{empresa?.codigoVinculacion || "..."}</span>
                    </div>
                    <button onClick={copiarCodigo}
                        className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                            copiado ? "bg-emerald-50 border-emerald-300 text-emerald-700" : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                        }`}>
                        {copiado ? "¡Copiado!" : "Copiar"}
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={confirmarRegen}
                onClose={() => setConfirmarRegen(false)}
                onConfirm={handleRegenerarCodigo}
                title="Generar nuevo código"
                message="Al generar un nuevo código, el anterior dejará de funcionar para nuevos registros. Los empleados ya vinculados no se verán afectados."
                type="primary"
                confirmLabel="Generar"
            />
        </div>
    );
};

// ── Tab: Catálogo de Productos ────────────────────────────────────────────
const TabCatalogo = () => {
    const { config, recargarConfig } = useConfig();
    const [productos, setProductos] = useState([]);
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        if (config?.productos) {
            setProductos(JSON.parse(JSON.stringify(config.productos)));
        }
    }, [config]);

    const handleGuardar = async () => {
        setCargando(true);
        try {
            await actualizarCatalogo(productos);
            await recargarConfig();
            toast.success("Catálogo guardado correctamente");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al guardar el catálogo");
        } finally {
            setCargando(false);
        }
    };

    const setItem = (index, field, value) => {
        const nuevos = [...productos];
        nuevos[index][field] = value;
        setProductos(nuevos);
    };

    const handleEliminar = (index) => setProductos(p => p.filter((_, i) => i !== index));
    
    const handleCrear = () => {
        setProductos(p => [
            ...p, 
            { key: `prod_${Date.now()}`, label: "Nuevo producto", precioDefault: 0 }
        ]);
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Tus Productos</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Controlá los precios base para Llenados y Ventas</p>
                </div>
                <button onClick={handleCrear} className="text-xs font-semibold px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors">
                    + Añadir
                </button>
            </div>
            
            <div className="divide-y divide-slate-100">
                {productos.length === 0 && <p className="text-center py-10 text-slate-400 text-sm">No hay productos configurados.</p>}
                
                {productos.map((prod, idx) => (
                    <div key={prod.key} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        <div className="flex-1 w-full">
                            <label className="block text-xs text-slate-400 mb-1">Nombre / Etiqueta</label>
                            <input type="text" value={prod.label} onChange={e => setItem(idx, "label", e.target.value)} className={`${inputCls} py-1.5`} />
                        </div>
                        <div className="w-full sm:w-32">
                            <label className="block text-xs text-slate-400 mb-1">Precio Unit. ($)</label>
                            <input type="number" min="0" value={prod.precioDefault} onChange={e => setItem(idx, "precioDefault", Number(e.target.value))} className={`${inputCls} py-1.5 text-center`} />
                        </div>
                        <div className="mt-2 sm:mt-5">
                            <button onClick={() => handleEliminar(idx)} className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors" title="Eliminar">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="w-5 h-5 stroke-current">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                <button onClick={handleGuardar} disabled={cargando} className={btnPrimary}>
                    {cargando ? "Guardando..." : "Guardar catálogo"}
                </button>
            </div>
        </div>
    );
};

// ── Tab: Personal ─────────────────────────────────────────────────────────
const TabPersonal = () => {
    const { usuario } = useAuth();
    const [usuarios, setUsuarios] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [procesando, setProcesando] = useState(null);
    const [error, setError] = useState(null);
    const [confirmarEliminar, setConfirmarEliminar] = useState(null);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            const { data } = await listarUsuarios();
            setUsuarios(data);
        } catch {
            setError("No se pudo cargar la lista de usuarios.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    const handleToggle = async (id) => {
        setProcesando(id);
        try {
            const { data } = await toggleActivo(id);
            setUsuarios((prev) => prev.map((u) => u._id === data._id ? data : u));
        } catch {
            toast.error("Error al actualizar el estado");
        } finally {
            setProcesando(null);
        }
    };

    const handleEliminar = async () => {
        const { id, nombre } = confirmarEliminar;
        setProcesando(id);
        try {
            await eliminarUsuario(id);
            setUsuarios((prev) => prev.filter((u) => u._id !== id));
            toast.success(`Usuario "${nombre}" eliminado.`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al eliminar");
        } finally {
            setProcesando(null);
            setConfirmarEliminar(null);
        }
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                    <h2 className="text-base font-bold text-slate-800">Personal Registrado</h2>
                    <p className="text-xs text-slate-400 mt-0.5">Autorizá o denegá acceso a tus empleados</p>
                </div>
                <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                    {usuarios.length} cuentas
                </span>
            </div>

            {error && <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>}

            {cargando ? (
                <div className="px-6 py-12 text-center text-sm text-slate-400">Cargando cuentas...</div>
            ) : usuarios.length === 0 ? (
                <div className="px-6 py-12 text-center text-sm text-slate-400">No hay empleados registrados todavía.</div>
            ) : (
                <ul className="divide-y divide-slate-100">
                    {usuarios.map((u) => {
                        const esSelf = u._id === usuario._id;
                        const ocupado = procesando === u._id;
                        return (
                            <li key={u._id} className="px-4 sm:px-6 py-4 flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                    <span className="text-sm font-bold text-blue-700">{u.nombre.charAt(0).toUpperCase()}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{u.nombre}</p>
                                        <RolBadge rol={u.rol} />
                                        <EstadoBadge activo={u.activo} />
                                        {esSelf && <span className="text-xs text-slate-400">(tu cuenta)</span>}
                                    </div>
                                    <p className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</p>
                                    
                                    {!esSelf && (
                                        <div className="flex items-center gap-2 mt-2">
                                            <button onClick={() => handleToggle(u._id)} disabled={ocupado}
                                                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                                                    u.activo ? "border-amber-300 text-amber-700 hover:bg-amber-50" : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                }`}>
                                                {ocupado ? "..." : u.activo ? "Desactivar" : "Activar"}
                                            </button>
                                            <button onClick={() => setConfirmarEliminar({ id: u._id, nombre: u.nombre })} disabled={ocupado}
                                                className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50">
                                                Eliminar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            )}

            <ConfirmModal
                isOpen={!!confirmarEliminar}
                onClose={() => setConfirmarEliminar(null)}
                onConfirm={handleEliminar}
                title="Eliminar usuario"
                message={confirmarEliminar ? `¿Eliminar a "${confirmarEliminar.nombre}"? Esta acción no se puede deshacer.` : ""}
                confirmLabel="Eliminar"
            />
        </div>
    );
};

// ── VISTA PRINCIPAL (Layout) ──────────────────────────────────────────────
const ConfigPage = () => {
    const { usuario } = useAuth();
    const [empresa, setEmpresa] = useState(null);
    const [tabList, setTabList] = useState("identidad");
    
    const [creandoEmpresa, setCreandoEmpresa] = useState(false);
    const [nombreCreacion, setNombreCreacion] = useState("");

    // Setup inicial de admin: carga la empresa, si la tiene
    useEffect(() => {
        if (usuario?.rol !== "admin" && usuario?.rol !== "superadmin") return;
        obtenerEmpresa().then(({ data }) => setEmpresa(data)).catch(() => {});
    }, [usuario]);

    const handleCrearEmpresa = async (e) => {
        e.preventDefault();
        if (!nombreCreacion.trim()) return;
        setCreandoEmpresa(true);
        try {
            const { data } = await crearEmpresa(nombreCreacion.trim());
            setEmpresa(data);
            toast.success(`Empresa "${data.nombre}" configurada`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al crear la base");
        } finally {
            setCreandoEmpresa(false);
        }
    };

    if (usuario?.rol !== "admin" && usuario?.rol !== "superadmin") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10 text-center max-w-sm">
                    <p className="text-slate-500 text-sm">Acceso restringido a administradores.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-3xl mx-auto">
                
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel de Administración</h1>
                    <p className="text-sm text-slate-500 mt-1">Personalizá tu empresa y controlá quién accede al sistema</p>
                </div>

                {/* Si no tiene empresa (el admin original post-migración) */}
                {!empresa ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200 px-6 py-8 text-center max-w-lg mx-auto">
                        <div className="mx-auto w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="w-8 h-8 text-blue-600">
                                <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-extrabold text-slate-800 mb-2">Comencemos</h2>
                        <p className="text-sm text-slate-500 mb-6 px-4">
                            Nombrá tu distribuidora para generar tu entorno privado y empezar a invitar a tus empleados.
                        </p>
                        <form onSubmit={handleCrearEmpresa} className="flex flex-col gap-3 max-w-xs mx-auto">
                            <input type="text" value={nombreCreacion} onChange={e => setNombreCreacion(e.target.value)} placeholder="Ej: Soda Los Andes" className={`${inputCls} text-center font-semibold text-lg`} />
                            <button type="submit" disabled={creandoEmpresa} className={`${btnPrimary} py-3 shadow-md`}>
                                {creandoEmpresa ? "Preparando todo..." : "Crear mi Entorno"}
                            </button>
                        </form>
                    </div>
                ) : (
                    <>
                        {/* ── Navegación de Tabs ── */}
                        <div className="flex gap-2 overflow-x-auto pb-6 scrollbar-hide">
                            {[
                                { id: "identidad", label: "Marca y Código" },
                                { id: "catalogo", label: "Catálogo de Productos" },
                                { id: "personal", label: "Empleados / Cuentas" }
                            ].map(tab => (
                                <button key={tab.id} onClick={() => setTabList(tab.id)}
                                    className={`whitespace-nowrap px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
                                        tabList === tab.id 
                                            ? "bg-slate-800 text-white shadow-md shadow-slate-200" 
                                            : "bg-white text-slate-500 border border-slate-200 hover:bg-slate-50 hover:text-slate-800"
                                    }`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Contenido de la Tab Activa ── */}
                        {tabList === "identidad" && <TabIdentidad empresa={empresa} setEmpresa={setEmpresa} />}
                        {tabList === "catalogo"  && <TabCatalogo />}
                        {tabList === "personal"  && <TabPersonal />}
                    </>
                )}
            </div>
        </div>
    );
};

export default ConfigPage;
