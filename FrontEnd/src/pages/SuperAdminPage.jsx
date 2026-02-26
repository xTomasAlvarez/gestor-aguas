import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate } from "react-router-dom";
import { getEmpresas, toggleSuspender } from "../services/superAdminService";
import ConfirmModal from "../components/ConfirmModal";
import toast from "react-hot-toast";

// ── Componentes de UI ────────────────────────────────────────────────
const BadgeEstado = ({ suspendida }) => (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${
        suspendida ? "bg-red-100 text-red-700" : "bg-emerald-100 text-emerald-700"
    }`}>
        <span className={`w-1.5 h-1.5 rounded-full ${suspendida ? "bg-red-500" : "bg-emerald-500"}`} />
        {suspendida ? "Suspendida" : "Activa"}
    </span>
);

const SuperAdminPage = () => {
    const { usuario } = useAuth();
    const [empresas, setEmpresas] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);
    const [confirmarSuspend, setConfirmarSuspend] = useState(null); // { id, nombre, suspendida }

    const cargarEmpresas = useCallback(async () => {
        try {
            setCargando(true);
            const { data } = await getEmpresas();
            setEmpresas(data);
        } catch {
            setError("Error al cargar la lista de empresas.");
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        if (usuario?.rol === "superadmin") {
            cargarEmpresas();
        }
    }, [cargarEmpresas, usuario?.rol]);

    const handleToggleSuspend = async () => {
        const { id, suspendida } = confirmarSuspend;
        try {
            const { data } = await toggleSuspender(id);
            setEmpresas((prev) => 
                prev.map((emp) => emp._id === id ? { ...emp, suspendida: data.suspendida } : emp)
            );
            toast.success(`Empresa ${suspendida ? 'activada' : 'suspendida'} correctamente.`);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al modificar la empresa.");
        } finally {
            setConfirmarSuspend(null);
        }
    };

    // Redirección forzada si no es superadmin (luego de declarar todos los hooks)
    if (usuario?.rol !== "superadmin") {
        return <Navigate to="/" replace />;
    }

    return (        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-32">
            <div className="max-w-6xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">SuperAdmin Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-1">Control global de todas las instancias (Kill Switch)</p>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                    <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-base font-bold text-slate-800">Empresas Registradas ({empresas.length})</h2>
                    </div>
                
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                <tr>
                                    <th className="px-6 py-4">Empresa</th>
                                    <th className="px-6 py-4">Código</th>
                                    <th className="px-6 py-4">Registro</th>
                                    <th className="px-6 py-4 text-center">Usuarios</th>
                                    <th className="px-6 py-4 text-center">Estado</th>
                                    <th className="px-6 py-4 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-slate-700">
                                {cargando ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">Cargando empresas...</td></tr>
                                ) : error ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-red-500">{error}</td></tr>
                                ) : empresas.length === 0 ? (
                                    <tr><td colSpan="6" className="px-6 py-8 text-center text-slate-400">No hay empresas registradas.</td></tr>
                                ) : (
                                    empresas.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4 font-semibold text-slate-900">{emp.nombre}</td>
                                            <td className="px-6 py-4 font-mono text-xs">{emp.codigoVinculacion}</td>
                                            <td className="px-6 py-4 text-xs text-slate-500">
                                                {new Date(emp.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md text-xs font-bold">
                                                    {emp.cantidadUsuarios}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <BadgeEstado suspendida={emp.suspendida} />
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <button
                                                    onClick={() => setConfirmarSuspend({ id: emp._id, nombre: emp.nombre, suspendida: emp.suspendida })}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                                                        emp.suspendida
                                                            ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                                                            : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                                    }`}
                                                >
                                                    {emp.suspendida ? "Reactivar" : "Suspender"}
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <ConfirmModal
                    isOpen={!!confirmarSuspend}
                    onClose={() => setConfirmarSuspend(null)}
                    onConfirm={handleToggleSuspend}
                    title={confirmarSuspend?.suspendida ? "Reactivar empresa" : "Suspender empresa (Kill Switch)"}
                    message={confirmarSuspend?.suspendida
                        ? `¿Estás seguro que deseas RESTAURAR el acceso a "${confirmarSuspend?.nombre}"? Todos los usuarios podrán volver a usar el sistema.`
                        : `¿Estás seguro que deseas SUSPENDER el acceso a "${confirmarSuspend?.nombre}"? ESTO BLOQUEARÁ INMEDIATAMENTE A TODOS SUS USUARIOS.`}
                    type={confirmarSuspend?.suspendida ? "primary" : "danger"}
                    confirmLabel={confirmarSuspend?.suspendida ? "Reactivar" : "Suspender"}
                    cancelLabel="Cancelar"
                />
            </div>
        </div>
    );
};

export default SuperAdminPage;
