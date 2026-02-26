import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { listarUsuarios, toggleActivo, eliminarUsuario } from "../services/adminService";

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
    const [procesando, setProcesando] = useState(null); // id del usuario siendo procesado

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

    const handleEliminar = async (id, nombre) => {
        if (!window.confirm(`Eliminar al usuario "${nombre}"? Esta accion no se puede deshacer.`)) return;
        setProcesando(id);
        try {
            await eliminarUsuario(id);
            setUsuarios((prev) => prev.filter((u) => u._id !== id));
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
                                                        onClick={() => handleEliminar(u._id, u.nombre)}
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
        </div>
    );
};

export default ConfigPage;
