import { useState, useEffect, useMemo } from "react";
import { useAuth }         from "../context/AuthContext";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas }   from "../services/ventasService";
import toast               from "react-hot-toast";
import { Send, Users, AlertCircle, Clock, MessageSquare } from "lucide-react";

// ── Utilidades ─────────────────────────────────────────────────────────────
const HACE_UNA_SEMANA = () => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d;
};

const formatTel = (tel = "") => tel.replace(/\D/g, "");

const FILTROS = [
    { key: "todos",     label: "Todos los clientes",         Icon: Users        },
    { key: "deuda",     label: "Con saldo pendiente",        Icon: AlertCircle  },
    { key: "inactivos", label: "Sin compra en 7 dias",       Icon: Clock        },
];

// ── Componente ─────────────────────────────────────────────────────────────
const BroadcastPage = () => {
    const { usuario } = useAuth();

    const [clientes,  setClientes]  = useState([]);
    const [ventas,    setVentas]    = useState([]);
    const [cargando,  setCargando]  = useState(true);
    const [filtro,    setFiltro]    = useState("todos");
    const [mensaje,   setMensaje]   = useState(
        "Hola {nombre}, te contactamos de Aguas Trancas. "
    );

    // Cargar datos al montar
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

    // ── Lógica de filtrado ─────────────────────────────────────────────────
    const clientesFiltrados = useMemo(() => {
        if (filtro === "deuda") {
            return clientes.filter((c) => (c.saldo_pendiente ?? 0) > 0);
        }
        if (filtro === "inactivos") {
            const limite = HACE_UNA_SEMANA();
            // Set de IDs de clientes que compraron en la última semana
            const recientes = new Set(
                ventas
                    .filter((v) => new Date(v.fecha) >= limite && v.items?.length > 0)
                    .map((v) => String(v.cliente?._id ?? v.cliente))
            );
            return clientes.filter((c) => !recientes.has(String(c._id)));
        }
        return clientes;
    }, [clientes, ventas, filtro]);

    // ── Abrir WhatsApp ────────────────────────────────────────────────────
    const abrirWhatsApp = (cliente) => {
        const tel = formatTel(cliente.telefono || "");
        if (!tel) {
            toast.error(`${cliente.nombre} no tiene numero de telefono registrado.`);
            return;
        }
        const texto = mensaje.replace(/\{nombre\}/gi, cliente.nombre);
        const url   = `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`;
        window.open(url, "_blank", "noopener,noreferrer");
    };

    // Acceso restringido
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
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Encabezado */}
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Difusion</h1>
                    <p className="text-sm text-slate-500 mt-1">Envia mensajes personalizados por WhatsApp a tus clientes</p>
                </div>

                {/* Redactor de mensaje */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-3">
                        <MessageSquare className="w-4 h-4 text-blue-600" />
                        <h2 className="text-sm font-bold text-slate-700">Mensaje</h2>
                    </div>
                    <textarea
                        rows={4}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Escribe tu mensaje. Usa {nombre} para personalizar."
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition text-sm resize-none"
                    />
                    <p className="text-xs text-slate-400 mt-2">
                        Usa <code className="bg-slate-100 px-1 rounded">{"{nombre}"}</code> para insertar el nombre del cliente automáticamente.
                    </p>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                    <h2 className="text-sm font-bold text-slate-700 mb-4">Filtrar destinatarios</h2>
                    <div className="flex flex-wrap gap-2">
                        {FILTROS.map(({ key, label, Icon }) => (
                            <button key={key} onClick={() => setFiltro(key)}
                                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                                    filtro === key
                                        ? "bg-blue-700 text-white border-blue-700"
                                        : "bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:text-blue-700"
                                }`}>
                                <Icon className="w-4 h-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Lista de clientes */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                        <h2 className="text-sm font-bold text-slate-700">
                            Destinatarios
                        </h2>
                        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                            {cargando ? "..." : `${clientesFiltrados.length} clientes`}
                        </span>
                    </div>

                    {cargando ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">Cargando clientes...</div>
                    ) : clientesFiltrados.length === 0 ? (
                        <div className="px-6 py-12 text-center text-sm text-slate-400">
                            Ningun cliente coincide con el filtro seleccionado.
                        </div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {clientesFiltrados.map((c) => (
                                <li key={c._id} className="px-6 py-4 flex items-center gap-4">
                                    {/* Avatar */}
                                    <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                        <span className="text-sm font-bold text-blue-700">
                                            {c.nombre.charAt(0).toUpperCase()}
                                        </span>
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-slate-800 truncate">{c.nombre}</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {c.telefono
                                                ? c.telefono
                                                : <span className="text-amber-500">Sin telefono</span>
                                            }
                                            {(c.saldo_pendiente ?? 0) > 0 && (
                                                <span className="ml-2 text-red-500 font-medium">
                                                    · Deuda: ${c.saldo_pendiente.toLocaleString("es-AR")}
                                                </span>
                                            )}
                                        </p>
                                    </div>

                                    {/* Botón WhatsApp */}
                                    <button
                                        onClick={() => abrirWhatsApp(c)}
                                        disabled={!mensaje.trim()}
                                        className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 disabled:text-slate-400 text-white transition-colors"
                                    >
                                        <Send className="w-3.5 h-3.5" />
                                        WhatsApp
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BroadcastPage;
