import { useState, useEffect, useMemo } from "react";
import usePagination from "../hooks/usePagination";
import Pagination from "../components/Pagination";
import { obtenerVentas }   from "../services/ventasService";
import { obtenerGastos }   from "../services/gastosService";
import { obtenerLlenados } from "../services/llenadoService";
import { formatPeso, dayKey, hoyLocal, formatDate } from "../utils/format";

// ── Helpers ────────────────────────────────────────────────────────────────
const hoyStr = hoyLocal();

const cantProd = (items, prodId) => {
    const found = items?.find((i) => i.producto?._id === prodId);
    return found ? found.cantidad : 0;
};

// ── Badge de método de pago ────────────────────────────────────────────────
const MetodoBadge = ({ metodo, fechaSaldado }) => {
    if (metodo === "fiado" && fechaSaldado) {
        return (
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full border bg-teal-50 text-teal-700 border-teal-200">
                Saldado: {fechaSaldado}
            </span>
        );
    }

    const map = {
        efectivo:      "bg-emerald-50 text-emerald-700 border-emerald-200",
        fiado:         "bg-red-50    text-red-700    border-red-200",
        transferencia: "bg-blue-50   text-blue-700   border-blue-200",
    };
    return (
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${map[metodo] || "bg-slate-100 text-slate-600 border-slate-200"}`}>
            {metodo}
        </span>
    );
};

// ── SECCIÓN 1: Tabla de ventas ─────────────────────────────────────────────
const TablaVentas = ({ ventas, ventasTotales }) => {
    const listaParaTotal = ventasTotales || ventas;

    if (listaParaTotal.length === 0) return (
        <p className="text-center py-8 text-sm text-slate-400">Sin ventas para este dia.</p>
    );
    
    const productosUnicos = useMemo(() => {
        const productosMap = new Map();
        listaParaTotal.forEach(v => {
            v.items?.forEach(i => {
                if (i.producto && typeof i.producto === 'string') {
                    const normalizedKey = i.producto.trim().toLowerCase().replace('bidón', 'bidon');
                    if (!productosMap.has(normalizedKey)) {
                        productosMap.set(normalizedKey, i.producto);
                    }
                }
            });
        });
        return Array.from(productosMap.values()).sort();
    }, [listaParaTotal]);

    const cantProdNormalizado = (items, prodNombre) => {
        const normalizedProd = prodNombre.trim().toLowerCase().replace('bidón', 'bidon');
        const itemEncontrado = items?.find(i => {
            if (!i.producto || typeof i.producto !== 'string') return false;
            const itemNormalized = i.producto.trim().toLowerCase().replace('bidón', 'bidon');
            return itemNormalized === normalizedProd;
        });
        return itemEncontrado ? itemEncontrado.cantidad : 0;
    };

    const totalDia  = listaParaTotal.reduce((acc, v) => acc + v.total, 0);
    const totalEfectivo = listaParaTotal
        .filter(v => v.metodo_pago === "efectivo")
        .reduce((acc, v) => acc + (v.monto_pagado ?? v.total), 0);
    const totalTransferencia = listaParaTotal
        .filter(v => v.metodo_pago === "transferencia")
        .reduce((acc, v) => acc + (v.monto_pagado ?? v.total), 0);
    const totalGeneral = totalEfectivo + totalTransferencia;
    const totalSaldo = listaParaTotal.reduce((acc, v) => acc + Math.max(0, v.total - (v.monto_pagado ?? v.total)), 0);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 rounded-tl-xl font-semibold">Cliente</th>
                        {productosUnicos.map(prod => (
                            <th key={prod} className="text-center px-2 py-3 font-semibold">
                                {prod.replace("Bidon ", "")}
                            </th>
                        ))}
                        <th className="text-right px-3 py-3 font-semibold">Total</th>
                        <th className="text-right px-3 py-3 font-semibold text-emerald-700">Abono</th>
                        <th className="text-right px-3 py-3 font-semibold text-red-600">Saldo</th>
                        <th className="text-center px-3 py-3 rounded-tr-xl font-semibold">Pago</th>
                    </tr>
                </thead>
                <tbody>
                    {ventas.map((v) => {
                        const abono = v.monto_pagado ?? v.total;
                        const saldo = Math.max(0, v.total - abono);
                        return (
                            <tr
                                key={v._id}
                                className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                    saldo > 0 ? "bg-red-50/30" : ""
                                }`}
                            >
                                <td className="px-4 py-3">
                                    <p className="font-semibold text-slate-800 leading-tight">
                                        {v.cliente?.nombre || "—"}
                                    </p>
                                    {v.cliente?.direccion && (
                                        <p className="text-xs text-slate-400 mt-0.5">{v.cliente.direccion}</p>
                                    )}
                                </td>
                                {productosUnicos.map(prod => (
                                    <td key={prod} className="text-center px-2 py-3 font-bold text-slate-700">
                                        {cantProdNormalizado(v.items, prod) || <span className="text-slate-300">—</span>}
                                    </td>
                                ))}
                                <td className="text-right px-3 py-3 font-bold text-slate-800">
                                    {formatPeso(v.total)}
                                </td>
                                <td className="text-right px-3 py-3 font-semibold text-emerald-700">
                                    {formatPeso(abono)}
                                    {v.metodo_pago === "fiado" && v.monto_pagado > 0 && v.updatedAt && (
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            (Pagado el {formatDate(v.updatedAt)})
                                        </p>
                                    )}
                                </td>
                                <td className={`text-right px-3 py-3 font-bold ${
                                    saldo > 0 ? "text-red-600" : "text-slate-300"
                                }`}>
                                    {saldo > 0 ? formatPeso(saldo) : "—"}
                                </td>
                                <td className="text-center px-3 py-3">
                                    <MetodoBadge 
                                        metodo={v.metodo_pago} 
                                        fechaSaldado={
                                            v.metodo_pago === 'fiado' && v.estado === 'saldado' && v.updatedAt 
                                                ? new Date(v.updatedAt).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' }) 
                                                : null
                                        } 
                                    />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
                {/* Fila de totales */}
                <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 text-sm">
                        <td className="px-4 py-3 rounded-bl-xl">
                            TOTAL DIA
                            <span className="ml-2 text-xs font-normal text-slate-500">({listaParaTotal.length} ventas)</span>
                        </td>
                        {productosUnicos.map(prod => (
                            <td key={prod} className="text-center px-2 py-3">
                                {listaParaTotal.reduce((acc, v) => acc + cantProdNormalizado(v.items, prod), 0) || "—"}
                            </td>
                        ))}
                        <td className="text-right px-3 py-3 text-blue-700">{formatPeso(totalDia)}</td>
                        <td className="text-right px-3 py-3 text-emerald-700">
                            {formatPeso(totalGeneral)}
                            <div className="mt-1 flex flex-col items-end gap-0.5">
                                <span className="block text-[10px] text-slate-500 font-normal">💵 Efvo: {formatPeso(totalEfectivo)}</span>
                                <span className="block text-[10px] text-slate-500 font-normal">📱 Transf: {formatPeso(totalTransferencia)}</span>
                            </div>
                        </td>
                        <td className={`text-right px-3 py-3 ${totalSaldo > 0 ? "text-red-600" : "text-slate-300"}`}>
                            {totalSaldo > 0 ? formatPeso(totalSaldo) : "—"}
                        </td>
                        <td className="rounded-br-xl" />
                    </tr>
                </tfoot>
            </table>
        </div>
    );
};

// ── SECCIÓN 2 Izquierda: Gastos del día ───────────────────────────────────
const TablaGastos = ({ gastos }) => {
    const total = gastos.reduce((acc, g) => acc + g.monto, 0);
    return (
        <div>
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Gastos del dia</h3>
            {gastos.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sin gastos.</p>
            ) : (
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {gastos.map((g) => (
                            <tr key={g._id} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5 text-slate-700">{g.concepto}</td>
                                <td className="py-2.5 text-right font-semibold text-slate-800">{formatPeso(g.monto)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-slate-200 font-bold text-slate-800">
                            <td className="pt-2.5">Total</td>
                            <td className="pt-2.5 text-right text-red-600">{formatPeso(total)}</td>
                        </tr>
                    </tfoot>
                </table>
            )}
        </div>
    );
};

// ── SECCIÓN 2 Izquierda: Llenados del día ────────────────────────────────
const TablaLlenados = ({ llenados }) => {
    const acumulado = llenados.reduce((acc, l) => {
        l.productos.forEach(({ producto, cantidad }) => {
            acc[producto] = (acc[producto] || 0) + cantidad;
        });
        return acc;
    }, {});
    const costoTotal = llenados.reduce((acc, l) => acc + (l.costo_total || 0), 0);

    return (
        <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Llenados del dia</h3>
            {llenados.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Sin llenados.</p>
            ) : (
                <>
                    {/* Cargas individuales */}
                    {llenados.map((l, cargaIdx) => (
                        <div key={l._id} className="flex flex-wrap gap-1.5 py-2 border-b border-slate-100 last:border-0">
                            <span className="text-xs font-semibold text-slate-500">Carga {cargaIdx + 1}:</span>
                            {l.productos.map((p, j) => (
                                <span key={j} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                                    {p.cantidad} {p.producto}
                                </span>
                            ))}
                            {l.costo_total != null && (
                                <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full ml-auto">{formatPeso(l.costo_total)}</span>
                            )}
                        </div>
                    ))}
                    {/* Acumulado */}
                    <div className="mt-2 pt-2 border-t-2 border-slate-200">
                        <p className="text-xs font-bold text-slate-500 mb-1">Acumulado del dia:</p>
                        <div className="flex flex-wrap gap-2">
                            {Object.entries(acumulado).map(([prod, cant]) => (
                                <span key={prod} className="text-sm font-bold bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
                                    {cant} {prod}
                                </span>
                            ))}
                        </div>
                        {costoTotal > 0 && (
                            <p className="text-xs text-slate-500 mt-1.5">Costo total llenados: <span className="font-semibold">{formatPeso(costoTotal)}</span></p>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// ── SECCIÓN 2 Centro: Cobranzas de Fiados Anteriores ─────────────────────
const TablaCobranzas = ({ cobranzas }) => {
    return (
        <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Cobranzas Extra (Fiados anteriores)</h3>
            {cobranzas.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">No se registraron cobros de deudas anteriores en este día.</p>
            ) : (
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {cobranzas.map((c) => (
                            <tr key={c._id} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5">
                                    <p className="font-semibold text-slate-700">{c.cliente?.nombre || "—"}</p>
                                    {c.venta?.fecha && (
                                        <p className="text-xs text-slate-400">
                                            (Deuda del {formatDate(c.venta.fecha)})
                                        </p>
                                    )}
                                </td>
                                <td className="py-2.5 text-right font-bold text-emerald-700">{formatPeso(c.monto)}</td>
                                <td className="py-2.5 text-right">
                                    <MetodoBadge metodo={c.metodoPago || c.metodo_pago} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

// ── SECCIÓN 2 Derecha: Arqueo de caja ────────────────────────────────────
const ArqueoCaja = ({ ventas, gastos, cobranzas }) => {
    // Ingresos Ventas del dia (ignorando "fiado" para el cálculo de caja en efectivo/transferencia)
    let ingresosEfectivo      = ventas.filter((v) => v.metodo_pago === "efectivo").reduce((acc, v) => acc + (v.monto_pagado ?? v.total), 0);
    let ingresosTransferencia = ventas.filter((v) => v.metodo_pago === "transferencia").reduce((acc, v) => acc + (v.monto_pagado ?? v.total), 0);
    // Para fiado solo llevamos cuenta de lo pendiente (monto no cobrado / histórico)
    const pendienteFiado      = ventas.filter((v) => v.metodo_pago === "fiado").reduce((acc, v) => acc + Math.max(0, v.total - (v.monto_pagado ?? 0)), 0);

    // Ingresos por Cobranzas extra de días anteriores
    ingresosEfectivo      += cobranzas.filter(c => (c.metodoPago || c.metodo_pago) === "efectivo").reduce((acc, c) => acc + c.monto, 0);
    ingresosTransferencia += cobranzas.filter(c => (c.metodoPago || c.metodo_pago) === "transferencia").reduce((acc, c) => acc + c.monto, 0);

    const totalCobrado        = ingresosEfectivo + ingresosTransferencia;
    const totalEgresos        = gastos.reduce((acc, g) => acc + g.monto, 0);
    const cajaFinal           = totalCobrado - totalEgresos;

    const Fila = ({ label, valor, colorVal = "text-slate-800", small = false }) => (
        <div className={`flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0 ${small ? "opacity-80" : ""}`}>
            <p className={`${small ? "text-xs text-slate-500" : "text-sm font-semibold text-slate-700"}`}>{label}</p>
            <p className={`font-bold ${small ? "text-xs" : "text-sm"} ${colorVal}`}>{formatPeso(valor)}</p>
        </div>
    );

    return (
        <div className="bg-slate-900 rounded-2xl p-6 text-white h-full flex flex-col">
            <h3 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">Arqueo de caja</h3>

            {/* Ingresos */}
            <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ingresos cobrados</p>
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <p className="text-sm text-slate-300">Efectivo</p>
                    <p className="text-sm font-bold text-emerald-400">{formatPeso(ingresosEfectivo)}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <p className="text-sm text-slate-300">Transferencia</p>
                    <p className="text-sm font-bold text-blue-400">{formatPeso(ingresosTransferencia)}</p>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <p className="text-sm text-slate-300 flex items-center gap-2">
                        Pendiente fiado
                        <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">no cobrado</span>
                    </p>
                    <p className="text-sm font-bold text-red-400">{formatPeso(pendienteFiado)}</p>
                </div>
            </div>

            {/* Egresos */}
            <div className="mb-5">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Egresos</p>
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <p className="text-sm text-slate-300">Gastos operativos</p>
                    <p className="text-sm font-bold text-orange-400">{formatPeso(totalEgresos)}</p>
                </div>
            </div>

            {/* Separador */}
            <div className="border-t border-slate-600 my-2" />

            {/* Resultado */}
            <div className="mt-auto">
                <div className="flex items-end justify-between">
                    <p className="text-sm font-semibold text-slate-300 uppercase tracking-wider">Caja final</p>
                    <div className="text-right">
                        <p className={`text-3xl font-extrabold leading-none ${cajaFinal >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                            {formatPeso(cajaFinal)}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">Total cobrado - Gastos</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Página principal ───────────────────────────────────────────────────────
const PlanillaPage = () => {
    const [fecha,    setFecha]    = useState(hoyStr);
    const [ventas,   setVentas]   = useState([]);
    const [cobranzasExtra, setCobranzasExtra] = useState([]);
    const [gastos,   setGastos]   = useState([]);
    const [llenados, setLlenados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError(null);
                const [{ data: resVentas }, { data: g }, { data: l }] = await Promise.all([
                    obtenerVentas(fecha),
                    obtenerGastos(),
                    obtenerLlenados(),
                ]);
                
                // Extraer de la respuesta estructurada o por fallback
                if (resVentas && !Array.isArray(resVentas)) {
                    setVentas(resVentas.ventas || []);
                    setCobranzasExtra(resVentas.cobranzasExtra || []);
                } else {
                    setVentas(resVentas || []);
                    setCobranzasExtra([]);
                }
                
                setGastos(g);
                setLlenados(l);
            } catch {
                setError("No se pudo conectar con el servidor.");
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, [fecha]);

    // Ya no se filtran las ventas en memoria, el API devuelve las de "fecha" estrictamente
    const ventasDia   = ventas;
    const cobranzasDia = cobranzasExtra;
    const gastosDia   = useMemo(() => gastos.filter((g)   => dayKey(g.fecha)   === fecha), [gastos,   fecha]);
    const llenadosDia = useMemo(() => llenados.filter((l) => dayKey(l.fecha)   === fecha), [llenados, fecha]);

    // Paginación con Hook
    const {
        paginaActual,
        setPaginaActual,
        itemsPorPagina,
        setItemsPorPagina,
        resetPagination,
        items: ventasPaginadas,
        totalPaginas,
        indiceInicio,
        indiceFin
    } = usePagination({ data: ventasDia, initialItemsPerPage: 10 });

    // Resetear página al cambiar la fecha
    useEffect(() => {
        resetPagination();
    }, [fecha, resetPagination, itemsPorPagina]);

    const fechaLegible = new Date(fecha + "T12:00:00").toLocaleDateString("es-AR", {
        weekday: "long", day: "2-digit", month: "long", year: "numeric",
    });

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="max-w-6xl mx-auto mb-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-800">Planilla Diaria</h1>
                        <p className="text-sm text-slate-500 mt-1 capitalize">{fechaLegible}</p>
                    </div>
                    {/* Selector de fecha */}
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                            Seleccionar dia
                        </label>
                        <input
                            type="date"
                            value={fecha}
                            onChange={(e) => setFecha(e.target.value)}
                            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-800 font-semibold text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition cursor-pointer"
                        />
                    </div>
                </div>

                {/* KPIs rápidos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
                    {(() => {
                        const ingresosVentas = ventasDia.filter(v => v.metodo_pago !== "fiado").reduce((acc, v) => acc + (v.monto_pagado ?? v.total), 0);
                        const ingresosCobranzas = cobranzasDia.reduce((acc, c) => acc + c.monto, 0);
                        const totalIngresos = ingresosVentas + ingresosCobranzas;

                        return [
                            { label: "Ventas",    valor: ventasDia.length,  sufijo: "entregas",    color: "text-slate-800" },
                            { label: "Ingresos",  valor: formatPeso(totalIngresos),                color: "text-emerald-600" },
                            { label: "Gastos",    valor: formatPeso(gastosDia.reduce((a,g)=>a+g.monto,0)), color: "text-orange-600" },
                            { label: "Llenados",  valor: llenadosDia.length, sufijo: "cargas",      color: "text-slate-800" },
                        ].map(({ label, valor, sufijo, color }) => (
                            <div key={label} className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                            <p className={`text-xl font-extrabold mt-1 ${color}`}>
                                {valor}{sufijo && <span className="text-xs font-normal text-slate-400 ml-1">{sufijo}</span>}
                            </p>
                        </div>
                    ));
                    })()}
                </div>
            </div>

            {cargando && <p className="text-center py-20 text-slate-400">Cargando datos...</p>}
            {error && !cargando && (
                <div className="max-w-6xl mx-auto bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>
            )}

            {!cargando && !error && (
                <div className="max-w-6xl mx-auto flex flex-col gap-6">
                    {/* ── SECCIÓN 1: Paginacion y Tabla de ventas ───────────────────── */}
                    {ventasDia.length > 0 && (
                        <div className="mb-2">
                            <Pagination 
                                paginaActual={paginaActual}
                                totalPaginas={totalPaginas}
                                itemsPorPagina={itemsPorPagina}
                                totalItems={ventasDia.length}
                                indiceInicio={indiceInicio}
                                indiceFin={indiceFin}
                                setPaginaActual={setPaginaActual}
                                setItemsPorPagina={setItemsPorPagina}
                                itemLabel="ventas"
                                options={[5, 10, "Todos"]}
                            />
                        </div>
                    )}
                    
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Ventas del dia</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Detalle de todas las entregas realizadas</p>
                        </div>
                        <div className="p-2 sm:p-4">
                            <TablaVentas ventas={ventasPaginadas} ventasTotales={ventasDia} />
                        </div>
                    </div>

                    {/* ── SECCIÓN 2: Paneles inferiores ────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Izquierda: Gastos + Llenados + Cobranzas Extra */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
                            <TablaGastos  gastos={gastosDia} />
                            <TablaLlenados llenados={llenadosDia} />
                            <TablaCobranzas cobranzas={cobranzasDia} />
                        </div>

                        {/* Derecha: Arqueo de caja */}
                        <ArqueoCaja ventas={ventasDia} gastos={gastosDia} cobranzas={cobranzasDia} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanillaPage;
