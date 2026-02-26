import { useState, useEffect, useMemo, useRef } from "react";
import { useAuth }         from "../context/AuthContext";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas }   from "../services/ventasService";
import toast               from "react-hot-toast";
import { Send, Users, AlertCircle, Clock, MessageSquare, Zap } from "lucide-react";

// ── Utilidades ─────────────────────────────────────────────────────────────
const HACE_UNA_SEMANA = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
};

const FILTROS = [
    { key: "todos",     label: "Todos",              Icon: Users        },
    { key: "deuda",     label: "Con deuda",           Icon: AlertCircle  },
    { key: "inactivos", label: "Sin compra 7 dias",   Icon: Clock        },
];

// ── BroadcastPage ──────────────────────────────────────────────────────────
const BroadcastPage = () => {
    const { usuario } = useAuth();

    const [clientes,   setClientes]   = useState([]);
    const [ventas,     setVentas]     = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [filtro,     setFiltro]     = useState("todos");
    const [mensaje,    setMensaje]    = useState("Hola {nombre}, Mensaje. ");

    // ── Estado de ráfaga ──────────────────────────────────────────────────
    const [rafagaActiva,  setRafagaActiva]  = useState(false);
    const [indexActual,   setIndexActual]   = useState(0);
    const [enviados,      setEnviados]      = useState(new Set());
    const itemRefs = useRef([]);

    // Cargar datos
    useEffect(() => {
        const cargar = async () => {
            try {
                const [rc, rv] = await Promise.all([obtenerClientes(), obtenerVentas()]);
                setClientes(rc.data);
                setVentas(rv.data);
            } catch {
                toast.error("Error al cargar clientes.");
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    // Filtrado
    const clientesFiltrados = useMemo(() => {
        if (filtro === "deuda") return clientes.filter((c) => (c.saldo_pendiente ?? 0) > 0);
        if (filtro === "inactivos") {
            const limite   = HACE_UNA_SEMANA();
            const recientes = new Set(
                ventas
                    .filter((v) => new Date(v.fecha) >= limite && v.items?.length > 0)
                    .map((v)   => String(v.cliente?._id ?? v.cliente))
            );
            return clientes.filter((c) => !recientes.has(String(c._id)));
        }
        return clientes;
    }, [clientes, ventas, filtro]);

    // Al cambiar filtro, resetear ráfaga
    useEffect(() => {
        resetearRafaga();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filtro]);

    // Scroll automático al cliente activo en modo ráfaga
    useEffect(() => {
        if (rafagaActiva && itemRefs.current[indexActual]) {
            itemRefs.current[indexActual].scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }, [indexActual, rafagaActiva]);

    // ── Lógica de envío individual ─────────────────────────────────────────
    const abrirWhatsApp = (cliente, idx) => {
        const tel = (cliente.telefono || "").replace(/\D/g, "");
        if (!tel) {
            toast.error(`${cliente.nombre} no tiene numero de telefono.`);
            return;
        }
        const texto = mensaje.replace(/\{nombre\}/gi, cliente.nombre);
        window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, "_blank", "noopener,noreferrer");

        // En modo ráfaga: marcar como enviado y avanzar al siguiente
        if (rafagaActiva) {
            setEnviados((prev) => new Set([...prev, cliente._id]));
            const siguienteValido = encontrarSiguiente(idx + 1);
            if (siguienteValido !== -1) {
                setIndexActual(siguienteValido);
            } else {
                toast.success("Rafaga completada. Todos los clientes contactados.");
                setRafagaActiva(false);
            }
        }
    };

    const encontrarSiguiente = (desde) => {
        const lista = clientesFiltrados;
        for (let i = desde; i < lista.length; i++) {
            if (!enviados.has(lista[i]._id) && (lista[i].telefono || "").replace(/\D/g, "")) return i;
        }
        return -1;
    };

    const iniciarRafaga = () => {
        if (!mensaje.trim()) { toast.error("Escribe un mensaje antes de iniciar la rafaga."); return; }
        const primero = encontrarSiguiente(0);
        if (primero === -1) { toast.error("Ningun cliente tiene telefono registrado."); return; }
        setEnviados(new Set());
        setIndexActual(primero);
        setRafagaActiva(true);
        toast.success("Rafaga iniciada. Toca el boton naranja de cada cliente.");
    };

    const resetearRafaga = () => {
        setRafagaActiva(false);
        setEnviados(new Set());
        setIndexActual(0);
    };

    if (usuario?.rol !== "admin") {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-8 py-10 text-center max-w-sm">
                    <p className="text-slate-500 text-sm">Acceso restringido a administradores.</p>
                </div>
            </div>
        );
    }

    const sinEnviar = clientesFiltrados.length - enviados.size;

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
            <div className="max-w-3xl mx-auto space-y-5">

                {/* Encabezado */}
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Difusion</h1>
                    <p className="text-sm text-slate-500 mt-1">Envia mensajes por WhatsApp a tus clientes</p>
                </div>

                {/* Redactor */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-bold text-slate-700">Mensaje</h2>
                    </div>
                    <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)}
                        disabled={rafagaActiva}
                        placeholder="Escribe tu mensaje. Usa {nombre} para personalizar."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm resize-none disabled:bg-slate-50 disabled:text-slate-500" />
                    <p className="text-xs text-slate-400 mt-1.5">
                        Usa <code className="bg-slate-100 px-1 rounded">{"{nombre}"}</code> para insertar el nombre del cliente.
                    </p>
                </div>

                {/* Filtros + botón ráfaga */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
                    <h2 className="text-sm font-bold text-slate-700 mb-3">Filtrar destinatarios</h2>
                    <div className="flex flex-wrap gap-2 mb-4">
                        {FILTROS.map(({ key, label, Icon }) => (
                            <button key={key} onClick={() => { setFiltro(key); }}
                                disabled={rafagaActiva}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 ${
                                    filtro === key
                                        ? "bg-blue-700 text-white border-blue-700"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                                }`}>
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>

                    {/* Botón ráfaga / cancelar */}
                    {!rafagaActiva ? (
                        <button onClick={iniciarRafaga} disabled={cargando || clientesFiltrados.length === 0}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-colors text-sm flex items-center justify-center gap-2">
                            <Zap className="w-4 h-4" />
                            Iniciar rafaga ({clientesFiltrados.length} clientes)
                        </button>
                    ) : (
                        <div className="flex items-center gap-3">
                            <div className="flex-1 bg-orange-50 border border-orange-200 rounded-xl px-4 py-2.5">
                                <p className="text-xs font-semibold text-orange-700">
                                    Rafaga activa — {enviados.size} enviados · {sinEnviar} pendientes
                                </p>
                            </div>
                            <button onClick={resetearRafaga}
                                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors">
                                Cancelar
                            </button>
                        </div>
                    )}
                </div>

                {/* Lista de clientes */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700">Destinatarios</h2>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {cargando ? "..." : `${clientesFiltrados.length} clientes`}
                        </span>
                    </div>

                    {cargando ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">Cargando...</div>
                    ) : clientesFiltrados.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            Ningun cliente coincide con el filtro.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {clientesFiltrados.map((c, idx) => {
                                const enviado    = enviados.has(c._id);
                                const esSiguiente = rafagaActiva && !enviado && idx === indexActual;
                                const sinTel      = !(c.telefono || "").replace(/\D/g, "");

                                return (
                                    <li key={c._id}
                                        ref={(el) => (itemRefs.current[idx] = el)}
                                        className={`px-5 py-4 flex items-center gap-4 transition-colors ${
                                            enviado       ? "bg-slate-50 opacity-60"  :
                                            esSiguiente   ? "bg-orange-50"            : ""
                                        }`}>
                                        {/* Avatar */}
                                        <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                                            enviado ? "bg-emerald-100" : "bg-blue-100"
                                        }`}>
                                            <span className={`text-sm font-bold ${enviado ? "text-emerald-700" : "text-blue-700"}`}>
                                                {enviado ? "✓" : c.nombre.charAt(0).toUpperCase()}
                                            </span>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold truncate ${enviado ? "text-slate-400 line-through" : "text-slate-800"}`}>
                                                {c.nombre}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {sinTel
                                                    ? <span className="text-amber-500">Sin telefono</span>
                                                    : <span className="font-mono">+{c.telefono}</span>
                                                }
                                                {(c.saldo_pendiente ?? 0) > 0 && (
                                                    <span className="ml-2 text-red-500 font-medium">
                                                        · Deuda: ${c.saldo_pendiente.toLocaleString("es-AR")}
                                                    </span>
                                                )}
                                            </p>
                                        </div>

                                        {/* Botón */}
                                        {enviado ? (
                                            <span className="flex-shrink-0 text-xs font-semibold text-emerald-600 px-3 py-1.5">
                                                Enviado
                                            </span>
                                        ) : (
                                            <button
                                                onClick={() => abrirWhatsApp(c, idx)}
                                                disabled={!mensaje.trim() || sinTel}
                                                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm ${
                                                    esSiguiente
                                                        ? "bg-orange-500 hover:bg-orange-600 text-white ring-2 ring-orange-300 scale-105"
                                                        : "bg-emerald-600 hover:bg-emerald-700 text-white disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none"
                                                }`}>
                                                <Send className="w-3.5 h-3.5" />
                                                {esSiguiente ? "Enviar ahora" : "WhatsApp"}
                                            </button>
                                        )}
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

export default BroadcastPage;
