import { useState, useRef, useEffect } from "react";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas, crearVenta, actualizarVenta, anularVenta } from "../services/ventasService";
import useListaCrud from "../hooks/useListaCrud";
import FiltroTiempo from "../components/FiltroTiempo";
import Modal from "../components/Modal";
import { formatFecha, formatPeso, groupByDay, formatFechaDia, filtrarPorTiempo, FILTRO_CONFIG } from "../utils/format";
import { inputCls, btnPrimary, btnSecondary } from "../styles/cls";

// ── Constantes ────────────────────────────────────────────────────────────
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
const FORM_VACIO = { cliente: "", metodo_pago: "efectivo", descuento: 0, productos: { ...PROD_VACIO }, monto_pagado: "", esCobranza: false };

// Helpers
const calcItems = (prods) =>
    Object.entries(prods)
        .filter(([, v]) => Number(v.cantidad) > 0)
        .map(([producto, v]) => ({
            producto,
            cantidad:        Number(v.cantidad),
            precio_unitario: Number(v.precio_unitario),
            subtotal:        Number(v.cantidad) * Number(v.precio_unitario),
        }));

const calcTotal = (prods, descuento) =>
    calcItems(prods).reduce((a, i) => a + i.subtotal, 0) - Number(descuento || 0);

const ventaToForm = (v) => {
    const prods = JSON.parse(JSON.stringify(PROD_VACIO));
    v.items.forEach(({ producto, cantidad, precio_unitario }) => { prods[producto] = { cantidad, precio_unitario }; });
    return {
        cliente:      v.cliente?._id || v.cliente,
        metodo_pago:  v.metodo_pago,
        descuento:    v.descuento,
        productos:    prods,
        monto_pagado: v.monto_pagado ?? "",
        esCobranza:   v.items.length === 0,
    };
};

// ── Autocompletado de clientes ─────────────────────────────────────────────
const ClienteSearch = ({ clientes, value, onChange }) => {
    const [query,     setQuery]     = useState("");
    const [abierto,   setAbierto]   = useState(false);
    const [highlight, setHighlight] = useState(-1);
    const wrapRef = useRef(null);

    // Nombre del cliente seleccionado (para mostrar en el input)
    const nombreSeleccionado = value
        ? (clientes.find((c) => c._id === value)?.nombre || "")
        : "";

    const filtrados = query.length > 0
        ? clientes.filter((c) => c.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
        : clientes.slice(0, 8);

    // Cerrar al hacer click fuera
    useEffect(() => {
        const handler = (e) => {
            if (wrapRef.current && !wrapRef.current.contains(e.target)) setAbierto(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const seleccionar = (cliente) => {
        onChange(cliente._id);
        setQuery("");
        setAbierto(false);
        setHighlight(-1);
    };

    const handleKey = (e) => {
        if (!abierto) return;
        if (e.key === "ArrowDown") { e.preventDefault(); setHighlight((p) => Math.min(p + 1, filtrados.length - 1)); }
        if (e.key === "ArrowUp")   { e.preventDefault(); setHighlight((p) => Math.max(p - 1, 0)); }
        if (e.key === "Enter" && highlight >= 0) { e.preventDefault(); seleccionar(filtrados[highlight]); }
        if (e.key === "Escape")    setAbierto(false);
    };

    return (
        <div ref={wrapRef} className="relative">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Cliente *</label>
            {/* Input de búsqueda — muestra el nombre si ya hay selección */}
            {value && !abierto ? (
                <button type="button" onClick={() => { setAbierto(true); setQuery(""); }}
                    className={`${inputCls} text-left w-full flex items-center justify-between`}>
                    <span className="truncate font-semibold text-slate-800">{nombreSeleccionado}</span>
                    <span className="text-xs text-blue-600 ml-2 shrink-0">Cambiar</span>
                </button>
            ) : (
                <input
                    type="text"
                    autoComplete="off"
                    value={query}
                    onChange={(e) => { setQuery(e.target.value); setAbierto(true); setHighlight(-1); }}
                    onFocus={() => setAbierto(true)}
                    onKeyDown={handleKey}
                    placeholder="Buscar cliente..."
                    className={inputCls}
                />
            )}
            {/* Dropdown */}
            {abierto && (
                <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-52 overflow-y-auto">
                    {filtrados.length === 0 && (
                        <p className="px-4 py-3 text-sm text-slate-400">Sin resultados.</p>
                    )}
                    {filtrados.map((c, i) => (
                        <button key={c._id} type="button"
                            onMouseDown={() => seleccionar(c)}
                            className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                i === highlight ? "bg-blue-50 text-blue-700" : "hover:bg-slate-50 text-slate-800"
                            }`}>
                            <span className="font-semibold">{c.nombre}</span>
                            {c.direccion && <span className="text-xs text-slate-400 ml-2">{c.direccion}</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Formulario de venta ───────────────────────────────────────────────────
const FormVenta = ({ clientes, inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form,     setForm]     = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const esCobranza = form.esCobranza;
    const items      = esCobranza ? [] : calcItems(form.productos);
    const total      = esCobranza ? 0  : calcTotal(form.productos, form.descuento);

    // monto_pagado efectivo: si está vacío y no es cobranza, default = total
    const montoPagadoEfectivo = form.monto_pagado === ""
        ? (esCobranza ? 0 : total)
        : Number(form.monto_pagado);
    const saldoPendiente = esCobranza ? 0 : Math.max(0, total - montoPagadoEfectivo);

    const setProd = (key, campo, val) =>
        setForm((p) => ({ ...p, productos: { ...p.productos, [key]: { ...p.productos[key], [campo]: val } } }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null);
        if (!form.cliente) return setError("Selecciona un cliente.");
        if (esCobranza && montoPagadoEfectivo <= 0) return setError("Ingresa el monto del pago.");
        if (!esCobranza && !items.length) return setError("Ingresa al menos un producto.");
        if (!esCobranza && total < 0)     return setError("El total no puede ser negativo.");
        setEnviando(true);
        try {
            await onGuardar({
                cliente:      form.cliente,
                metodo_pago:  esCobranza ? "efectivo" : form.metodo_pago,
                descuento:    esCobranza ? 0 : Number(form.descuento),
                items,
                total:        esCobranza ? 0 : total,
                monto_pagado: montoPagadoEfectivo,
            });
            if (!esEdicion) setForm(FORM_VACIO);
        } catch (err) { setError(err.response?.data?.message || "Error al guardar."); }
        finally { setEnviando(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Toggle modo cobranza */}
            {!esEdicion && (
                <button type="button"
                    onClick={() => setForm((p) => ({ ...FORM_VACIO, cliente: p.cliente, esCobranza: !p.esCobranza }))}
                    className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors ${
                        esCobranza
                            ? "bg-emerald-50 border-emerald-300 text-emerald-800"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300"
                    }`}>
                    <div className="text-left">
                        <p className="text-sm font-bold">{esCobranza ? "Modo: Pago de deuda" : "Modo: Venta"}</p>
                        <p className="text-xs opacity-70 mt-0.5">{esCobranza ? "Solo registra un cobro sobre deuda existente" : "Toca para cambiar a solo pago de deuda"}</p>
                    </div>
                    <div className={`w-10 h-6 rounded-full transition-colors relative ${esCobranza ? "bg-emerald-500" : "bg-slate-300"}`}>
                        <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${esCobranza ? "translate-x-5" : "translate-x-1"}`} />
                    </div>
                </button>
            )}

            {/* Cliente + Método (método oculto en cobranza) */}
            <div className={`grid grid-cols-1 gap-3 ${!esCobranza ? "sm:grid-cols-2" : ""}`}>
                <ClienteSearch clientes={clientes} value={form.cliente}
                    onChange={(id) => setForm((p) => ({ ...p, cliente: id }))} />
                {!esCobranza && (
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Metodo de pago</label>
                        <select value={form.metodo_pago}
                            onChange={(e) => setForm((p) => ({ ...p, metodo_pago: e.target.value }))}
                            className={inputCls}>
                            {METODOS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                        </select>
                    </div>
                )}
            </div>

            {/* Productos (ocultos en modo cobranza) */}
            {!esCobranza && (
                <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Productos</p>
                    <div className="flex flex-col gap-2">
                        {PRODUCTOS.map(({ key, label }) => {
                            const cant = Number(form.productos[key].cantidad);
                            return (
                                <div key={key} className="bg-slate-50 rounded-xl px-4 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-700">{label}</span>
                                        <div className="flex items-center gap-1">
                                            <button type="button"
                                                onClick={() => setProd(key, "cantidad", Math.max(0, cant - 1))}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-200 active:bg-slate-300 text-slate-700 text-xl font-bold touch-manipulation select-none">−</button>
                                            <span className="w-8 text-center text-lg font-extrabold text-slate-900 tabular-nums">{cant}</span>
                                            <button type="button"
                                                onClick={() => setProd(key, "cantidad", cant + 1)}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-700 active:bg-blue-800 text-white text-xl font-bold touch-manipulation select-none">+</button>
                                        </div>
                                    </div>
                                    {cant > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Precio unit.</span>
                                            <input type="number" inputMode="numeric" min="0"
                                                value={form.productos[key].precio_unitario}
                                                onChange={(e) => setProd(key, "precio_unitario", e.target.value)}
                                                className="w-28 text-center px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                            <span className="text-xs text-slate-500">= {formatPeso(cant * Number(form.productos[key].precio_unitario))}</span>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Descuento + Totales (ocultos en cobranza) */}
            {!esCobranza && (
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <label className="text-sm text-slate-600 font-medium">Descuento ($)</label>
                        <input type="number" inputMode="numeric" min="0" value={form.descuento}
                            onChange={(e) => setForm((p) => ({ ...p, descuento: e.target.value }))}
                            className="w-28 text-center px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="text-right">
                        <p className="text-xs text-slate-400 uppercase tracking-wider">Total</p>
                        <p className={`text-2xl font-extrabold ${total < 0 ? "text-red-600" : "text-slate-800"}`}>{formatPeso(total)}</p>
                    </div>
                </div>
            )}

            {/* Monto pagado / Campo de cobranza */}
            <div className={`rounded-xl px-4 py-3 flex flex-col gap-2 border ${
                esCobranza ? "bg-emerald-50 border-emerald-200" : "bg-blue-50 border-blue-100"
            }`}>
                <div className="flex items-center justify-between gap-3">
                    <label className={`text-sm font-semibold ${esCobranza ? "text-emerald-800" : "text-blue-800"}`}>
                        {esCobranza ? "Monto que paga el cliente" : "Monto que entrega el cliente"}
                    </label>
                    <input
                        type="number" inputMode="numeric" min="0"
                        value={form.monto_pagado}
                        onChange={(e) => setForm((p) => ({ ...p, monto_pagado: e.target.value }))}
                        placeholder={esCobranza ? "Ej: 5000" : formatPeso(total)}
                        className={`w-32 text-center px-3 py-2 rounded-xl border bg-white text-slate-800 font-bold text-sm focus:outline-none focus:ring-2 ${
                            esCobranza ? "border-emerald-300 focus:ring-emerald-400" : "border-blue-200 focus:ring-blue-500"
                        }`} />
                </div>
                {!esCobranza && (
                    saldoPendiente > 0 ? (
                        <p className="text-xs font-semibold text-red-600">
                            Saldo que va a deuda: <span className="text-sm">{formatPeso(saldoPendiente)}</span>
                        </p>
                    ) : (
                        <p className="text-xs text-emerald-700 font-semibold">Pago completo — sin deuda monetaria.</p>
                    )
                )}
                {esCobranza && montoPagadoEfectivo > 0 && (
                    <p className="text-xs font-semibold text-emerald-700">Se descontaran {formatPeso(montoPagadoEfectivo)} de la deuda del cliente.</p>
                )}
            </div>

            {!esCobranza && form.metodo_pago === "fiado" && items.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 text-amber-700 rounded-xl px-4 py-2.5 text-sm">
                    Atencion: se registra como fiado. Se sumara la deuda de envases al cliente.
                </div>
            )}
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}

            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar" : esCobranza ? "Registrar pago" : "Registrar venta"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};

// ── Badge de método ───────────────────────────────────────────────────────
const METODO_CLS = {
    efectivo:      "bg-emerald-50 text-emerald-700 border-emerald-200",
    fiado:         "bg-red-50    text-red-700    border-red-200",
    transferencia: "bg-blue-50   text-blue-700   border-blue-200",
};
const MetodoBadge = ({ metodo }) => (
    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${METODO_CLS[metodo] || "bg-slate-100"}`}>
        {metodo}
    </span>
);

// ── Accordion de días ─────────────────────────────────────────────────────
const VentaFila = ({ venta, onEditar, onAnular }) => {
    const saldo = Math.max(0, venta.total - (venta.monto_pagado || 0));
    return (
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
                {saldo > 0 && (
                    <span className="text-xs text-red-600 font-semibold">Debe: {formatPeso(saldo)}</span>
                )}
                <div className="flex gap-2 mt-0.5">
                    <button onClick={() => onEditar(venta)} className="text-xs text-blue-600 hover:underline">Editar</button>
                    <button onClick={() => onAnular(venta._id)} className="text-xs text-red-500 hover:underline">Anular</button>
                </div>
            </div>
        </div>
    );
};

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onAnular }) => (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button onClick={() => onToggle(diaKey)}
            className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition text-left">
            <div>
                <p className="text-sm font-bold text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                <p className="text-xs text-slate-400">{items.length} {items.length === 1 ? "venta" : "ventas"}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-sm font-bold text-slate-700">{formatPeso(items.reduce((a, v) => a + v.total, 0))}</p>
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

// ── Página principal ──────────────────────────────────────────────────────
const VentasPage = () => {
    const { items: ventas,   cargando: cargV, error: errorV, cargar: recargarVentas } =
        useListaCrud(() => obtenerVentas().then((r) => r.data));
    const { items: clientes, cargando: cargC, error: errorC } =
        useListaCrud(() => obtenerClientes().then((r) => r.data));

    const [filtroTiempo, setFiltroTiempo] = useState("hoy");
    const [expanded,     setExpanded]     = useState(new Set());
    const [editando,     setEditando]     = useState(null);
    const [modalCrear,   setModalCrear]   = useState(false);

    const cargando = cargV || cargC;
    const error    = errorV || errorC;

    const handleFiltro = (val) => { setFiltroTiempo(val); setExpanded(new Set()); };
    const toggleDia = (key) => setExpanded((p) => {
        const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleCrear  = async (payload) => { await crearVenta(payload); await recargarVentas(); setModalCrear(false); };
    const handleEditar = async (payload) => { await actualizarVenta(editando._id, payload); await recargarVentas(); setEditando(null); };
    const handleAnular = async (id) => {
        if (!window.confirm("Anular esta venta? Se revertira la deuda si era fiado.")) return;
        await anularVenta(id); await recargarVentas();
    };

    const filtradas    = filtrarPorTiempo(ventas, filtroTiempo);
    const porDia       = groupByDay(filtradas);
    const dias         = Object.keys(porDia).sort().reverse();
    const totalPeriodo = filtradas.reduce((a, v) => a + v.total, 0);
    const totalFiado   = filtradas.filter((v) => v.metodo_pago === "fiado").reduce((a, v) => a + v.total, 0);
    const labelCorto   = FILTRO_CONFIG.find((f) => f.value === filtroTiempo)?.labelCorto || "";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-4xl mx-auto mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Ventas</h1>
                    <p className="text-sm text-slate-500 mt-1">Registro y control de entregas.</p>
                </div>
                <button onClick={() => setModalCrear(true)} className={`hidden sm:block ${btnPrimary}`}>+ Nueva venta</button>
            </div>

            {/* FAB mobile */}
            <button
                onClick={() => setModalCrear(true)}
                className="sm:hidden fixed bottom-[4.5rem] right-4 z-30 w-14 h-14 rounded-full bg-blue-700 active:bg-blue-800 shadow-lg flex items-center justify-center text-white text-3xl font-bold touch-manipulation select-none"
                aria-label="Nueva venta">+</button>

            <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { label: `Ventas ${labelCorto}`,    val: filtradas.length,  fmt: false, cls: "text-slate-800" },
                    { label: `Facturado ${labelCorto}`, val: totalPeriodo,      fmt: true,  cls: "text-slate-800" },
                    { label: `Fiado ${labelCorto}`,     val: totalFiado,        fmt: true,  cls: "text-red-600",  border: "border-red-200", span: true },
                ].map(({ label, val, fmt, cls, border = "border-slate-200", span }) => (
                    <div key={label} className={`bg-white border ${border} rounded-2xl shadow-sm px-4 py-4 text-center ${span ? "col-span-2 sm:col-span-1" : ""}`}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">{label}</p>
                        <p className={`text-xl font-extrabold mt-1 ${cls}`}>{fmt ? formatPeso(val) : val}</p>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700">
                    Historial <span className="ml-2 text-sm font-normal text-slate-400">({filtradas.length} registros)</span>
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

            <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nueva venta" maxWidth="max-w-xl">
                <FormVenta clientes={clientes} onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} />
            </Modal>
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar venta" maxWidth="max-w-xl">
                {editando && (
                    <FormVenta clientes={clientes} inicial={ventaToForm(editando)}
                        onGuardar={handleEditar} onCancelar={() => setEditando(null)} esEdicion />
                )}
            </Modal>
        </div>
    );
};

export default VentasPage;
