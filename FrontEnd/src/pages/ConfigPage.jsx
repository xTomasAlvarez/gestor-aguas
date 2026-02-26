import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { listarUsuarios, toggleActivo, eliminarUsuario, obtenerEmpresa, crearEmpresa, regenerarCodigo } from "../services/adminService";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

// ── Badge de estado ────────────────────────────────────────────────────────
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
        rol === "admin"
            ? "bg-blue-100 text-blue-700"
            : "bg-slate-100 text-slate-600"
    }`}>
        {rol === "admin" ? "Admin" : "Empleado"}
    </span>
);

// ── Página principal ───────────────────────────────────────────────────────
const ConfigPage = () => {
    const { usuario } = useAuth();
    const [usuarios,  setUsuarios]  = useState([]);
    const [cargando,  setCargando]  = useState(true);
    const [error,     setError]     = useState(null);
    const [procesando,   setProcesando]  = useState(null);
    const [confirmar,    setConfirmar]   = useState(null); // { id, nombre }
    const [empresa,      setEmpresa]     = useState(null); // { nombre, codigoVinculacion }
    const [copiado,      setCopiado]     = useState(false);
    const [confirmarRegen,     setConfirmarRegen]     = useState(false);
    const [regenCargando,      setRegenCargando]      = useState(false);
    const [nombreEmpresaForm,  setNombreEmpresaForm]  = useState("");
    const [creandoEmpresa,     setCreandoEmpresa]     = useState(false);

    const cargar = useCallback(async () => {
        try {
            setCargando(true);
            setError(null);
            const { data } = await listarUsuarios();
            setUsuarios(data);
        } catch {
            setError("No se pudo cargar la lista de usuarios.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);

    // Cargar empresa del admin (silencioso si no tiene businessId todavía)
    useEffect(() => {
        if (usuario?.rol !== "admin") return;
        obtenerEmpresa().then(({ data }) => setEmpresa(data)).catch(() => {});
    }, [usuario]);

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
            toast.success("Nuevo código generado correctamente.");
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al regenerar el código.");
        } finally {
            setRegenCargando(false);
        }
    };

    const handleCrearEmpresa = async (e) => {
        e.preventDefault();
        if (!nombreEmpresaForm.trim()) return toast.error("Ingresá un nombre para la empresa.");
        setCreandoEmpresa(true);
        try {
            const { data } = await crearEmpresa(nombreEmpresaForm.trim());
            setEmpresa(data);
            setNombreEmpresaForm("");
            toast.success(`Empresa “${data.nombre}” creada correctamente.`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al crear la empresa.");
        } finally {
            setCreandoEmpresa(false);
        }
    };

    const handleToggle = async (id) => {
        setProcesando(id);
        try {
            const { data } = await toggleActivo(id);
            setUsuarios((prev) => prev.map((u) => u._id === data._id ? data : u));
        } catch {
            setError("Error al actualizar el estado del usuario.");
        } finally {
            setProcesando(null);
        }
    };

    const handleEliminar = async () => {
        const { id, nombre } = confirmar;
        setProcesando(id);
        try {
            await eliminarUsuario(id);
            setUsuarios((prev) => prev.filter((u) => u._id !== id));
            toast.success(`Usuario "${nombre}" eliminado.`);
        } catch (err) {
            setError(err.response?.data?.message || "Error al eliminar el usuario.");
        } finally {
            setProcesando(null);
        }
    };

    // Solo admins pueden ver esta página
    if (usuario?.rol !== "admin") {
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

                {/* Encabezado */}
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Configuracion</h1>
                    <p className="text-sm text-slate-500 mt-1">Gestion de personal y accesos al sistema</p>
                </div>

                {/* Panel empresa */}
                {empresa ? (
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5 mb-6">
                        <div className="flex items-start justify-between gap-3 mb-4">
                            <div>
                                <h2 className="text-base font-bold text-slate-800">Código de vinculación</h2>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Compartí este código con tus empleados para que se registren en <span className="font-semibold">{empresa.nombre}</span>
                                </p>
                            </div>
                            <button
                                onClick={() => setConfirmarRegen(true)}
                                disabled={regenCargando}
                                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors disabled:opacity-50">
                                {regenCargando ? "Generando..." : "Generar nuevo"}
                            </button>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-center">
                                <span className="text-2xl font-extrabold tracking-widest text-slate-800 font-mono">{empresa.codigoVinculacion}</span>
                            </div>
                            <button onClick={copiarCodigo}
                                className={`flex-shrink-0 px-4 py-3 rounded-xl text-sm font-semibold border transition-colors ${
                                    copiado
                                        ? "bg-emerald-50 border-emerald-300 text-emerald-700"
                                        : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-700"
                                }`}>
                                {copiado ? "¡Copiado!" : "Copiar"}
                            </button>
                        </div>
                    </div>
                ) : (
                    /* Admin existente sin empresa: panel de configuración inicial */
                    <div className="bg-white rounded-2xl shadow-sm border border-blue-200 px-6 py-5 mb-6">
                        <div className="flex items-start gap-4">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
                                <svg viewBox="0 0 24 24" fill="none" strokeWidth={2} className="w-5 h-5 text-blue-600">
                                    <path strokeLinecap="round" strokeLinejoin="round" stroke="currentColor"
                                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                            <div className="flex-1">
                                <h2 className="text-base font-bold text-slate-800">Configurá tu empresa</h2>
                                <p className="text-xs text-slate-500 mt-0.5 mb-4">
                                    Tu cuenta aún no tiene una empresa asignada. Creála ahora para obtener el código de vinculación para tus empleados.
                                </p>
                                <form onSubmit={handleCrearEmpresa} className="flex gap-2">
                                    <input
                                        type="text"
                                        value={nombreEmpresaForm}
                                        onChange={(e) => setNombreEmpresaForm(e.target.value)}
                                        placeholder="Nombre de tu empresa"
                                        className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                                    />
                                    <button type="submit" disabled={creandoEmpresa}
                                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white font-bold rounded-xl text-sm transition-colors">
                                        {creandoEmpresa ? "Creando..." : "Crear"}
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Panel de Personal */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Personal registrado</h2>
                            <p className="text-xs text-slate-400 mt-0.5">
                                Activa o desactiva el acceso de cada empleado
                            </p>
                        </div>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {usuarios.length} usuarios
                        </span>
                    </div>

                    {error && (
                        <div className="mx-6 mt-4 bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                            {error}
                        </div>
                    )}

                    {cargando ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">Cargando...</div>
                    ) : usuarios.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">No hay usuarios registrados.</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {usuarios.map((u) => {
                                const esSelf = u._id === usuario._id;
                                const ocupado = procesando === u._id;

                                return (
                                    <li key={u._id} className="px-4 sm:px-6 py-4 flex items-start gap-3">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                                            <span className="text-sm font-bold text-blue-700">
                                                {u.nombre.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Contenedor principal — crece y se envuelve */}
                                        <div className="flex-1 min-w-0">
                                            {/* Fila 1: nombre + badges */}
                                            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                <p className="text-sm font-semibold text-slate-800 truncate">{u.nombre}</p>
                                                <RolBadge rol={u.rol} />
                                                <EstadoBadge activo={u.activo} />
                                                {esSelf && (
                                                    <span className="text-xs text-slate-400">(tu cuenta)</span>
                                                )}
                                            </div>
                                            {/* Email */}
                                            <p className="text-xs text-slate-400 mt-0.5 truncate">{u.email}</p>

                                            {/* Fila 2: botones — solo para otros usuarios */}
                                            {!esSelf && (
                                                <div className="flex items-center gap-2 mt-2">
                                                    <button
                                                        onClick={() => handleToggle(u._id)}
                                                        disabled={ocupado}
                                                        className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors disabled:opacity-50 ${
                                                            u.activo
                                                                ? "border-amber-300 text-amber-700 hover:bg-amber-50"
                                                                : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                                                        }`}>
                                                        {ocupado ? "..." : u.activo ? "Desactivar" : "Activar"}
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmar({ id: u._id, nombre: u.nombre })}
                                                        disabled={ocupado}
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
                </div>
            </div>

        <ConfirmModal
            isOpen={!!confirmar}
            onClose={() => setConfirmar(null)}
            onConfirm={handleEliminar}
            title="Eliminar usuario"
            message={confirmar ? `¿Eliminar a "${confirmar.nombre}"? Esta acción no se puede deshacer.` : ""}
            confirmLabel="Eliminar"
        />

        <ConfirmModal
            isOpen={confirmarRegen}
            onClose={() => setConfirmarRegen(false)}
            onConfirm={handleRegenerarCodigo}
            title="Generar nuevo código"
            message="Al generar un nuevo código, el anterior dejará de funcionar para nuevos registros. Los empleados ya vinculados no se verán afectados."
            type="primary"
            confirmLabel="Generar"
            cancelLabel="Cancelar"
        />
    </div>
    );
};

export default ConfigPage;

