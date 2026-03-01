import { useState, useCallback, useEffect } from "react";
import {
    obtenerClientes, crearCliente, actualizarCliente, eliminarCliente
} from "../services/clienteService";
import Modal        from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import toast        from "react-hot-toast";
import { Archive } from "lucide-react";

import FormCliente from "../components/clientes/FormCliente";
import ClienteCard from "../components/clientes/ClienteCard";
import ModalInactivos from "../components/clientes/ModalInactivos";
import ModalHistorialFiados from "../components/clientes/ModalHistorialFiados";
// ── Página principal ──────────────────────────────────────────────────────
const ClientesPage = () => {
    const [clientes,       setClientes]       = useState([]);
    const [busqueda,       setBusqueda]       = useState("");
    const [filtroLocalidad,setFiltroLocalidad] = useState("Todas");
    const [filtroEstado,   setFiltroEstado]   = useState("Todos");
    const [cargando,       setCargando]       = useState(true);
    const [error,          setError]          = useState(null);
    const [editando,       setEditando]       = useState(null);
    const [clienteHistorial,setClienteHistorial] = useState(null);
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

    // ── Lógica de Filtrado Local ──
    const localidadesUnicas = ["Todas", ...new Set(clientes.map(c => c.localidad).filter(Boolean))].sort();

    const clientesFiltrados = clientes.filter((c) => {
        const matchBusqueda = c.nombre.toLowerCase().includes(busqueda.toLowerCase());
        const matchLoc = filtroLocalidad === "Todas" || c.localidad === filtroLocalidad;
        let matchEst = true;
        if (filtroEstado === "Con Deuda") {
            const d = c.deuda || {};
            matchEst = d.bidones_20L > 0 || d.bidones_12L > 0 || d.sodas > 0 || (c.saldo_pendiente > 0);
        } else if (filtroEstado === "Al Día") {
            const d = c.deuda || {};
            matchEst = !(d.bidones_20L > 0 || d.bidones_12L > 0 || d.sodas > 0 || (c.saldo_pendiente > 0));
        }
        return matchBusqueda && matchLoc && matchEst;
    });

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

            <div className="max-w-6xl mx-auto mb-5 flex flex-col sm:flex-row gap-3">
                <input type="text" placeholder="Buscar por nombre..." value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition shadow-sm border-b-2 border-b-blue-500/0 hover:border-b-blue-500/20" />
                
                <select value={filtroLocalidad} onChange={e => setFiltroLocalidad(e.target.value)}
                    className="sm:w-48 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer font-medium text-sm">
                    {localidadesUnicas.map(loc => <option key={loc} value={loc}>{loc === "Todas" ? "Todas las localidades" : loc}</option>)}
                </select>

                <select value={filtroEstado} onChange={e => setFiltroEstado(e.target.value)}
                    className="sm:w-40 px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm cursor-pointer font-medium text-sm">
                    <option value="Todos">Todos</option>
                    <option value="Con Deuda">Con Deuda</option>
                    <option value="Al Día">Al Día</option>
                </select>
            </div>

            {cargando && <p className="max-w-6xl mx-auto text-center py-16 text-slate-400">Cargando clientes...</p>}
            {error && !cargando && <div className="max-w-6xl mx-auto bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>}
            {!cargando && !error && clientesFiltrados.length === 0 && <p className="max-w-6xl mx-auto text-center py-16 text-slate-400">No se encontraron clientes activos con los filtros aplicados.</p>}
            {!cargando && !error && clientesFiltrados.length > 0 && (
                <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {clientesFiltrados.map((c) => (
                        <ClienteCard key={c._id} cliente={c} onEditar={setEditando}
                            onDesactivar={(cli) => setConfirmarDesact(cli)}
                            onVerHistorico={setClienteHistorial} />
                    ))}
                </div>
            )}

            {/* Modal edición */}
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar cliente">
                {editando && (
                    <FormCliente
                        inicial={{ nombre: editando.nombre, direccion: editando.direccion || "", localidad: editando.localidad || "", telefono: editando.telefono || "", dispensersAsignados: editando.dispensersAsignados || 0 }}
                        onGuardar={handleEditar}
                        onCancelar={() => setEditando(null)}
                        esEdicion
                    />
                )}
            </Modal>

            {/* Modal Historial de Fiados */}
            <Modal isOpen={!!clienteHistorial} onClose={() => setClienteHistorial(null)} title={`Trazabilidad de Deuda: ${clienteHistorial?.nombre}`}>
                {clienteHistorial && <ModalHistorialFiados cliente={clienteHistorial} />}
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
