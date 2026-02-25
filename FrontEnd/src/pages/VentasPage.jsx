import { useState, useEffect } from "react";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas, crearVenta, actualizarVenta, anularVenta } from "../services/ventasService";
import Modal from "../components/Modal";
import { formatFecha, formatPeso, groupByDay, formatFechaDia, filtrarPorTiempo, FILTRO_CONFIG } from "../utils/format";

const inputCls     = "w-full px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white";
const btnPrimary   = "px-5 py-2.5 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white text-sm font-semibold rounded-xl transition-colors";
const btnSecondary = "px-4 py-2 text-sm font-medium text-slate-600 hover:text-blue-700 border border-slate-200 rounded-xl hover:border-blue-400 transition-colors";

// ── Constantes del formulario ─────────────────────────────────────────────
const PRODUCTOS = [
    { key: "Bidon 20L", label: "Bidon 20L", precioDefault: 2500 },
    { key: "Bidon 12L", label: "Bidon 12L", precioDefault: 1800 },
    { key: "Soda",      label: "Soda",      precioDefault: 900  },
];
const METODOS = [
    { value: "efectivo",      label: "Efectivo"      },
    { value: "fiado",         label: "Fiado"          },
    { value: "transferencia", label: "Transferencia"  },
];
const PROD_VACIO = {
    "Bidon 20L": { cantidad: 0, precio_unitario: 2500 },
    "Bidon 12L": { cantidad: 0, precio_unitario: 1800 },
    "Soda":      { cantidad: 0, precio_unitario: 900  },
};
const FORM_VACIO = { cliente: "", metodo_pago: "efectivo", descuento: 0, productos: { ...PROD_VACIO } };

const calcularItems = (productos) =>
    Object.entries(productos)
        .filter(([, v]) => Number(v.cantidad) > 0)
        .map(([producto, v]) => ({
            producto,
            cantidad:        Number(v.cantidad),
            precio_unitario: Number(v.precio_unitario),
            subtotal:        Number(v.cantidad) * Number(v.precio_unitario),
        }));

const ventaToForm = (venta) => {
    const productos = { ...PROD_VACIO };
    venta.items.forEach(({ producto, cantidad, precio_unitario }) => {
        productos[producto] = { cantidad, precio_unitario };
    });
    return { cliente: venta.cliente?._id || venta.cliente, metodo_pago: venta.metodo_pago, descuento: venta.descuento, productos };
};

// ── Formulario crear/editar venta ─────────────────────────────────────────
const FormVenta = ({ clientes, inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form,     setForm]     = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const items = calcularItems(form.productos);
    const total = items.reduce((acc, i) => acc + i.subtotal, 0) - Number(form.descuento);

    const setProd = (key, campo, val) =>
        setForm((p) => ({ ...p, productos: { ...p.productos, [key]: { ...p.productos[key], [campo]: val } } }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (!form.cliente) return setError("Selecciona un cliente.");
        if (items.length === 0) return setError("Ingresa al menos un producto.");
        if (total < 0) return setError("El total no puede ser negativo.");
        setEnviando(true);
        try {
            await onGuardar({ cliente: form.cliente, metodo_pago: form.metodo_pago, descuento: Number(form.descuento), items, total });
            if (!esEdicion) setForm(FORM_VACIO);
        } catch (err) {
            setError(err.response?.data?.message || "Error al guardar.");
        } finally {
            setEnviando(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cliente *</label>
                    <select value={form.cliente} onChange={(e) => setForm((p) => ({ ...p, cliente: e.target.value }))} className={inputCls}>
                        <option value="">— Selecciona —</option>
                        {clientes.map((c) => (
                            <option key={c._id} value={c._id}>{c.nombre}{c.direccion ? ` — ${c.direccion}` : ""}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Metodo de pago</label>
                    <select value={form.metodo_pago} onChange={(e) => setForm((p) => ({ ...p, metodo_pago: e.target.value }))} className={inputCls}>
                        {METODOS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                    </select>
                </div>
            </div>

            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Productos</p>
                <div className="flex flex-col gap-2">
                    {PRODUCTOS.map(({ key, label }) => (
                        <div key={key} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center bg-slate-50 rounded-xl px-4 py-3">
                            <span className="text-sm font-medium text-slate-700">{label}</span>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] text-slate-400">Cantidad</span>
                                <input type="number" min="0" value={form.productos[key].cantidad}
                                    onChange={(e) => setProd(key, "cantidad", e.target.value)}
                                    className="w-20 text-center px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                            <div className="flex flex-col items-center gap-0.5">
                                <span className="text-[10px] text-slate-400">Precio unit.</span>
                                <input type="number" min="0" value={form.productos[key].precio_unitario}
                                    onChange={(e) => setProd(key, "precio_unitario", e.target.value)}
                                    className="w-24 text-center px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-3">
                    <label className="text-sm text-slate-600 font-medium">Descuento ($)</label>
                    <input type="number" min="0" value={form.descuento} onChange={(e) => setForm((p) => ({ ...p, descuento: e.target.value }))}
                        className="w-28 text-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="text-right">
                    <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                    <p className={`text-2xl font-extrabold ${total < 0 ? "text-red-600" : "text-slate-800"}`}>{formatPeso(total)}</p>
                </div>
            </div>

            {form.metodo_pago === "fiado" && items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-sm">
                    Atencion: esta venta se registra como fiado. Se sumara la deuda de envases al cliente.
                </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar venta" : "Registrar venta"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};

// ── Botones de filtro de tiempo ───────────────────────────────────────────
const FiltroTiempo = ({ valor, onChange }) => (
    <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
        {FILTRO_CONFIG.map(({ value, label }) => (
            <button
                key={value}
                onClick={() => onChange(value)}
                className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    valor === value
                        ? "bg-white text-blue-700 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                }`}
            >
                {label}
            </button>
        ))}
    </div>
);

// ── Badge de metodo de pago ───────────────────────────────────────────────
const MetodoBadge = ({ metodo }) => {
    const estilos = {
        efectivo:      "bg-emerald-50 text-emerald-700 border-emerald-200",
        fiado:         "bg-red-50    text-red-700    border-red-200",
        transferencia: "bg-blue-50   text-blue-700   border-blue-200",
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${estilos[metodo] || "bg-slate-100"}`}>
            {metodo}
        </span>
    );
};

// ── Accordion de días ─────────────────────────────────────────────────────
const VentaFila = ({ venta, onEditar, onAnular }) => (
    <div className="flex items-start justify-between py-2.5 border-b border-slate-100 last:border-0 gap-3">
        <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-slate-800 truncate">{venta.cliente?.nombre || "Cliente no disponible"}</p>
            <div className="flex flex-wrap gap-1 mt-1">
                {venta.items.map((item, i) => (
                    <span key={i} className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                        {item.cantidad}x {item.producto}
                    </span>
                ))}
            </div>
            <p className="text-xs text-slate-400 mt-1">{formatFecha(venta.fecha)}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 shrink-0">
            <p className="text-sm font-bold text-slate-800">{formatPeso(venta.total)}</p>
            <MetodoBadge metodo={venta.metodo_pago} />
            <div className="flex gap-2 mt-1">
                <button onClick={() => onEditar(venta)} className="text-xs text-blue-600 hover:underline">Editar</button>
                <button onClick={() => onAnular(venta._id)} className="text-xs text-red-500 hover:underline">Anular</button>
            </div>
        </div>
    </div>
);

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onAnular }) => {
    const totalDia = items.reduce((acc, v) => acc + v.total, 0);
    return (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <button onClick={() => onToggle(diaKey)}
                className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
                <div>
                    <p className="text-sm font-bold text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                    <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? "venta" : "ventas"}</p>
                </div>
                <div className="flex items-center gap-3">
                    <p className="text-sm font-bold text-slate-700">{formatPeso(totalDia)}</p>
                    <span className="text-slate-400 text-sm">{expanded ? "▲" : "▼"}</span>
                </div>
            </button>
            {expanded && (
                <div className="px-5 pb-3 border-t border-slate-100">
                    {items.map((v) => <VentaFila key={v._id} venta={v} onEditar={onEditar} onAnular={onAnular} />)}
                </div>
            )}
        </div>
    );
};

// ── Página principal ──────────────────────────────────────────────────────
const VentasPage = () => {
    const [ventas,       setVentas]       = useState([]);
    const [clientes,     setClientes]     = useState([]);
    const [cargando,     setCargando]     = useState(true);
    const [error,        setError]        = useState(null);
    const [filtroTiempo, setFiltroTiempo] = useState("hoy");
    const [expanded,     setExpanded]     = useState(new Set());
    const [editando,     setEditando]     = useState(null);
    const [modalCrear,   setModalCrear]   = useState(false);

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const [{ data: v }, { data: c }] = await Promise.all([obtenerVentas(), obtenerClientes()]);
            setVentas(v);
            setClientes(c);
        } catch { setError("No se pudo conectar con el servidor."); }
        finally { setCargando(false); }
    };

    useEffect(() => { cargarDatos(); }, []);

    const handleFiltro = (valor) => { setFiltroTiempo(valor); setExpanded(new Set()); };

    const toggleDia = (key) => setExpanded((prev) => {
        const next = new Set(prev);
        next.has(key) ? next.delete(key) : next.add(key);
        return next;
    });

    const handleCrear  = async (payload) => { await crearVenta(payload); await cargarDatos(); setModalCrear(false); };
    const handleEditar = async (payload) => { await actualizarVenta(editando._id, payload); await cargarDatos(); setEditando(null); };
    const handleAnular = async (id) => {
        if (!window.confirm("Anular esta venta? Se revertira la deuda si era fiado.")) return;
        await anularVenta(id);
        setVentas((p) => p.filter((v) => v._id !== id));
    };

    const filtradas  = filtrarPorTiempo(ventas, filtroTiempo);
    const porDia     = groupByDay(filtradas);
    const dias       = Object.keys(porDia).sort().reverse();
    const totalPeriodo = filtradas.reduce((acc, v) => acc + v.total, 0);
    const totalFiado   = filtradas.filter((v) => v.metodo_pago === "fiado").reduce((acc, v) => acc + v.total, 0);
    const labelCorto   = FILTRO_CONFIG.find((f) => f.value === filtroTiempo)?.labelCorto || "";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            {/* Header */}
            <div className="max-w-4xl mx-auto mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Ventas</h1>
                    <p className="text-sm text-slate-500 mt-1">Registro y control de entregas.</p>
                </div>
                <button onClick={() => setModalCrear(true)} className={btnPrimary}>+ Nueva venta</button>
            </div>

            {/* KPIs del período */}
            <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">Ventas {labelCorto}</p>
                    <p className="text-2xl font-extrabold text-slate-800 mt-1">{filtradas.length}</p>
                </div>
                <div className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4 text-center">
                    <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">Facturado {labelCorto}</p>
                    <p className="text-xl font-extrabold text-slate-800 mt-1">{formatPeso(totalPeriodo)}</p>
                </div>
                <div className="bg-white border border-red-200 rounded-2xl shadow-sm px-4 py-4 text-center col-span-2 sm:col-span-1">
                    <p className="text-xs text-red-400 uppercase tracking-wider capitalize">Fiado {labelCorto}</p>
                    <p className="text-xl font-extrabold text-red-600 mt-1">{formatPeso(totalFiado)}</p>
                </div>
            </div>

            {/* Filtros + historial */}
            <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700">
                    Historial
                    <span className="ml-2 text-sm font-normal text-slate-400">({filtradas.length} registros)</span>
                </h2>
                <FiltroTiempo valor={filtroTiempo} onChange={handleFiltro} />
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-2">
                {cargando && <p className="text-center py-16 text-slate-400">Cargando...</p>}
                {error && !cargando && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>}
                {!cargando && !error && dias.length === 0 && <p className="text-center py-16 text-slate-400">Sin ventas para este periodo.</p>}
                {!cargando && !error && dias.map((dk) => (
                    <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                        expanded={expanded.has(dk)} onToggle={toggleDia}
                        onEditar={setEditando} onAnular={handleAnular} />
                ))}
            </div>

            {/* Modal nueva venta */}
            <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nueva venta" maxWidth="max-w-xl">
                <FormVenta clientes={clientes} onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} />
            </Modal>

            {/* Modal editar venta */}
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar venta" maxWidth="max-w-xl">
                {editando && (
                    <FormVenta
                        clientes={clientes}
                        inicial={ventaToForm(editando)}
                        onGuardar={handleEditar}
                        onCancelar={() => setEditando(null)}
                        esEdicion
                    />
                )}
            </Modal>
        </div>
    );
};

export default VentasPage;
