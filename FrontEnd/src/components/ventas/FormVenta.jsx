import { useState } from "react";
import ClienteSearch from "./ClienteSearch";
import { formatPeso, hoyLocal, prepararFechaBackend } from "../../utils/format";
import { METODOS_PAGO as METODOS } from "../../utils/productos";
import { inputCls, btnPrimary, btnSecondary } from "../../styles/cls";

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

const FormVenta = ({ clientes, productosBase, onGuardar, onCancelar, inicial, esEdicion = false }) => {
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

            {/* Cliente + Método */}
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

            {/* Productos */}
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

            {/* Descuento + Totales */}
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

            {/* Monto pagado */}
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

export default FormVenta;
