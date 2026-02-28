import { useState, useRef, useEffect } from "react";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas, crearVenta, actualizarVenta, anularVenta } from "../services/ventasService";
import useListaCrud from "../hooks/useListaCrud";
import FiltroTiempo from "../components/FiltroTiempo";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import SkeletonLoader from "../components/SkeletonLoader";
import toast from "react-hot-toast";
import { formatFecha, formatPeso, groupByDay, formatFechaDia, filtrarPorTiempo, FILTRO_CONFIG, hoyLocal, isoToInputDate, prepararFechaBackend } from "../utils/format";
import { METODOS_PAGO as METODOS } from "../utils/productos";
import { inputCls, btnPrimary, btnSecondary } from "../styles/cls";
import { useConfig } from "../context/ConfigContext";

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

const ventaToForm = (v, catProductos) => {
    // Generamos un dicccionario base basado en el catálogo actual
    const prods = {};
    catProductos.forEach(p => { prods[p.key] = { cantidad: 0, precio_unitario: p.precioDefault }; });
    
    // Y pisamos con lo que la venta realmente guardó
    v.items.forEach(({ producto, cantidad, precio_unitario }) => { prods[producto] = { cantidad, precio_unitario }; });
    
    return {
        cliente:      v.cliente?._id || v.cliente,
        metodo_pago:  v.metodo_pago,
        descuento:    v.descuento,
        productos:    prods,
        monto_pagado: v.monto_pagado ?? "",
        esCobranza:   v.items.length === 0,
        fecha:        isoToInputDate(v.fecha)
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
                            {(c.direccion || c.localidad) && (
                                <span className="text-xs text-slate-400 ml-2">
                                    {c.direccion}{c.direccion && c.localidad ? " - " : ""}{c.localidad}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

// ── Formulario de venta ───────────────────────────────────────────────────
const FormVenta = ({ clientes, productosBase, onGuardar, onCancelar, inicial, esEdicion = false }) => {
    // Generar un estado por default basado en los productos dinámicos
    const defaultProductos = {};
    productosBase.forEach(p => { defaultProductos[p.key] = { cantidad: 0, precio_unitario: p.precioDefault }; });
    
    const [form, setForm] = useState(inicial || { 
        cliente: "", metodo_pago: "efectivo", descuento: 0, productos: defaultProductos, monto_pagado: "", esCobranza: false, fecha: hoyLocal() 
    });

    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const esCobranza = form.esCobranza;
    const items      = esCobranza ? [] : calcItems(form.productos);
    const total      = esCobranza ? 0  : calcTotal(form.productos, form.descuento);

    // monto_pagado efectivo: si está vacío y no es cobranza, default = total (salvo fiado)
    let montoPagadoEfectivo;
    if (form.monto_pagado === "") {
        montoPagadoEfectivo = (esCobranza || form.metodo_pago === "fiado") ? 0 : total;
    } else {
        montoPagadoEfectivo = Number(form.monto_pagado);
    }
    const saldoPendiente = esCobranza ? 0 : Math.max(0, total - montoPagadoEfectivo);

    const setProd = (key, campo, val) =>
        setForm((p) => ({ ...p, productos: { ...p.productos, [key]: { ...p.productos[key], [campo]: val } } }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setError(null);
        if (!form.cliente) return setError("Selecciona un cliente.");
        if (esCobranza && montoPagadoEfectivo <= 0) return setError("Ingresa el monto del pago.");
        if (!esCobranza && !items.length) return setError("Ingresa al menos un producto.");
        if (!esCobranza && total < 0)     return setError("El total no puede ser negativo.");
        if (form.fecha > hoyLocal())      return setError("No se pueden registrar fechas futuras.");
        setEnviando(true);
        try {
            await onGuardar({
                cliente:      form.cliente,
                metodo_pago:  esCobranza ? "efectivo" : form.metodo_pago,
                descuento:    esCobranza ? 0 : Number(form.descuento),
                items,
                total:        esCobranza ? 0 : total,
                monto_pagado: montoPagadoEfectivo,
                fecha:        prepararFechaBackend(form.fecha),
            });
            if (!esEdicion) {
                setForm({ cliente: "", metodo_pago: "efectivo", descuento: 0, productos: defaultProductos, monto_pagado: "", esCobranza: false, fecha: hoyLocal() });
            }
        } catch (err) { setError(err.response?.data?.message || "Error al guardar."); }
        finally { setEnviando(false); }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

            {/* Fecha del registro */}
            <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Fecha del registro</label>
                <input type="date" value={form.fecha} max={hoyLocal()}
                    onChange={(e) => setForm((p) => ({ ...p, fecha: e.target.value }))}
                    className={`${inputCls} sm:w-48`} />
            </div>

            {/* Toggle modo cobranza */}
            {!esEdicion && (
                <button type="button"
                    onClick={() => setForm((p) => ({ cliente: p.cliente, metodo_pago: "efectivo", descuento: 0, productos: defaultProductos, monto_pagado: "", fecha: hoyLocal(), esCobranza: !p.esCobranza }))}
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
                        {productosBase.map(({ key, label }) => {
                            const prodState = form.productos[key] || { cantidad: 0, precio_unitario: 0 };
                            const cant = Number(prodState.cantidad);
                            return (
                                <div key={key} className="bg-slate-50 rounded-xl px-4 py-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="text-sm font-semibold text-slate-700">{label}</span>
                                        <div className="flex items-center gap-1">
                                            <button type="button"
                                                onClick={() => setProd(key, "cantidad", Math.max(0, cant - 1))}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-slate-200 active:bg-slate-300 text-slate-700 text-xl font-bold touch-manipulation select-none">−</button>
                                            <input
                                                type="number"
                                                inputMode="numeric"
                                                min="0"
                                                value={prodState.cantidad === 0 ? "" : prodState.cantidad}
                                                onChange={(e) => setProd(key, "cantidad", e.target.value)}
                                                onBlur={(e) => {
                                                    const v = parseInt(e.target.value, 10);
                                                    setProd(key, "cantidad", isNaN(v) ? 0 : Math.max(0, v));
                                                }}
                                                placeholder="0"
                                                className="w-12 text-center text-lg font-extrabold text-slate-900 tabular-nums bg-transparent border-0 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-lg px-0"
                                            />
                                            <button type="button"
                                                onClick={() => setProd(key, "cantidad", cant + 1)}
                                                className="w-9 h-9 flex items-center justify-center rounded-lg bg-blue-700 active:bg-blue-800 text-white text-xl font-bold touch-manipulation select-none">+</button>
                                        </div>
                                    </div>
                                    {cant > 0 && (
                                        <div className="mt-2 flex items-center gap-2">
                                            <span className="text-xs text-slate-400">Precio unit.</span>
                                            <input type="number" inputMode="numeric" min="0"
                                                value={prodState.precio_unitario}
                                                onChange={(e) => setProd(key, "precio_unitario", e.target.value)}
                                                className="w-28 text-center px-2 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                            <span className="text-xs text-slate-500">= {formatPeso(cant * Number(prodState.precio_unitario))}</span>
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
                        placeholder={esCobranza ? "Ej: 5000" : (form.metodo_pago === "fiado" ? "$0" : formatPeso(total))}
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

// ── Fila de Venta (Estilo Card Móvil) ──────────────────────────────────────
const VentaFila = ({ venta, onEditar, onAnular }) => {
    const abono = venta.monto_pagado ?? venta.total;
    const saldo = Math.max(0, venta.total - abono);
    return (
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-sm border border-white/60 p-5 mb-3 lg:mb-4 last:mb-0 flex flex-col gap-3.5 relative hover:shadow-premium-hover hover:-translate-y-1 transition-all duration-300 group">
            <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-lg font-black font-display text-slate-800 truncate tracking-tight leading-tight">{venta.cliente?.nombre || "Cliente no disponible"}</p>
                    {(venta.cliente?.direccion || venta.cliente?.localidad) && (
                        <p className="text-xs font-semibold text-slate-500 mt-1 truncate tracking-wide">
                            {venta.cliente.direccion}{venta.cliente.direccion && venta.cliente.localidad ? " - " : ""}{venta.cliente.localidad}
                        </p>
                    )}
                    <span className="text-[10px] text-slate-400 mt-1 block font-bold uppercase tracking-widest">{formatFecha(venta.fecha)}</span>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <p className="text-xl font-black font-display text-slate-800 tracking-tight leading-none">{formatPeso(venta.total)}</p>
                    <MetodoBadge metodo={venta.metodo_pago} />
                </div>
            </div>
            
            <div className="flex items-center gap-1.5 flex-wrap">
                {venta.items.length === 0 ? (
                    <span className="text-xs font-bold text-slate-400 bg-slate-100 px-3 py-1 rounded-xl tracking-wide">Cobranza pura</span>
                ) : (
                    venta.items.map((item, i) => (
                        <span key={i} className="text-[11px] font-bold bg-blue-50 text-blue-700 shadow-sm border border-blue-100 px-2.5 py-1 rounded-xl">
                            {item.cantidad}x {item.producto}
                        </span>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between pt-3.5 border-t border-slate-100/60 mt-0.5">
                <div className="flex gap-2">
                    <button onClick={() => onEditar(venta)} className="text-xs font-bold text-blue-600 hover:text-blue-800 px-4 py-2 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl transition-colors">Editar</button>
                    <button onClick={() => onAnular(venta._id)} className="text-xs font-bold text-red-600 hover:text-red-800 px-4 py-2 bg-red-50 border border-red-100 hover:bg-red-100 rounded-xl transition-colors">Anular</button>
                </div>
                {saldo > 0 ? (
                    <div className="bg-red-50/80 px-4 py-2 rounded-xl border border-red-200/50 flex items-center gap-2 break-normal text-right shadow-sm">
                        <span className="text-[10px] uppercase font-bold text-red-400 tracking-widest">Deuda:</span>
                        <span className="text-base font-black font-display text-red-600">{formatPeso(saldo)}</span>
                    </div>
                ) : (
                    <div className="px-3 py-1.5 flex items-center gap-1.5 text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                        <svg viewBox="0 0 24 24" fill="none" strokeWidth={3} className="w-4 h-4 stroke-emerald-500">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className="text-[10px] uppercase font-bold tracking-widest pt-0.5">Saldado</span>
                    </div>
                )}
            </div>
        </div>
    );
};

const AccordionDia = ({ diaKey, items, expanded, onToggle, onEditar, onAnular }) => (
    <div className={`bg-white/70 backdrop-blur-md shadow-glass rounded-3xl overflow-hidden mb-4 transition-all duration-300 border ${expanded ? "border-blue-200/50" : "border-white/60"}`}>
        <button onClick={() => onToggle(diaKey)}
            className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/90 transition-colors text-left">
            <div>
                <p className="text-base font-black font-display tracking-tight text-slate-800 capitalize">{formatFechaDia(diaKey + "T12:00:00")}</p>
                <p className="text-xs font-semibold text-slate-500 mt-0.5">{items.length} {items.length === 1 ? "venta" : "ventas"}</p>
            </div>
            <div className="flex items-center gap-3">
                <p className="text-lg font-black font-display text-blue-700 bg-blue-50 px-3 py-1 rounded-xl">{formatPeso(items.reduce((a, v) => a + v.total, 0))}</p>
                <div className={`w-8 h-8 flex items-center justify-center rounded-full transition-transform duration-300 ${expanded ? "bg-slate-100 rotate-180" : "bg-slate-50"}`}>
                    <span className="text-slate-400 text-xs font-bold">▼</span>
                </div>
            </div>
        </button>
        {expanded && (
            <div className="px-5 pb-5 border-t border-slate-100/50 bg-slate-50/30 pt-5 animate-fade-in-up">
                {items.map((v) => <VentaFila key={v._id} venta={v} onEditar={onEditar} onAnular={onAnular} />)}
            </div>
        )}
    </div>
);

// ── Página principal ──────────────────────────────────────────────────────
const VentasPage = () => {
    const { config } = useConfig();
    const productosBase = config?.productos || [];

    const { items: ventas,   cargando: cargV, error: errorV, cargar: recargarVentas } =
        useListaCrud(() => obtenerVentas().then((r) => r.data));
    const { items: clientes, cargando: cargC, error: errorC } =
        useListaCrud(() => obtenerClientes().then((r) => r.data));

    const [filtroTiempo,    setFiltroTiempo]    = useState("hoy");
    const [expanded,        setExpanded]        = useState(new Set());
    const [editando,        setEditando]        = useState(null);
    const [modalCrear,      setModalCrear]      = useState(false);
    const [confirmarAnular, setConfirmarAnular] = useState(null); // { id }

    const cargando = cargV || cargC;
    const error    = errorV || errorC;

    const handleFiltro = (val) => { setFiltroTiempo(val); setExpanded(new Set()); };
    const toggleDia = (key) => setExpanded((p) => {
        const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleCrear  = async (payload) => { await crearVenta(payload); await recargarVentas(); setModalCrear(false); };
    const handleEditar = async (payload) => { await actualizarVenta(editando._id, payload); await recargarVentas(); setEditando(null); };
    const handleAnular = async () => {
        const { id } = confirmarAnular;
        await anularVenta(id);
        await recargarVentas();
        toast.success("Venta anulada. La deuda fue revertida.");
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

            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {cargando && <SkeletonLoader lines={3} />}
                {error && !cargando && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm font-semibold">{error}</div>}
                {!cargando && !error && dias.length === 0 && <p className="text-center py-16 text-slate-400">Sin ventas para este periodo.</p>}
                {!cargando && !error && dias.map((dk) => (
                    <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                        expanded={expanded.has(dk)} onToggle={toggleDia}
                        onEditar={setEditando}
                        onAnular={(id) => setConfirmarAnular({ id })} />
                ))}
            </div>

            <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nueva venta" maxWidth="max-w-xl">
                <FormVenta clientes={clientes} productosBase={productosBase} onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} />
            </Modal>
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar venta" maxWidth="max-w-xl">
                {editando && (
                    <FormVenta clientes={clientes} productosBase={productosBase} inicial={ventaToForm(editando, productosBase)}
                        onGuardar={handleEditar} onCancelar={() => setEditando(null)} esEdicion />
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!confirmarAnular}
                onClose={() => setConfirmarAnular(null)}
                onConfirm={handleAnular}
                title="Anular venta"
                message="¿Anular esta venta? Si era fiado, se revertirá la deuda del cliente."
                confirmLabel="Anular"
            />
        </div>
    );
};

export default VentasPage;
