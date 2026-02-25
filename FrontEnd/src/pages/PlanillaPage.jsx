import { useState, useEffect, useMemo } from "react";
import { obtenerVentas }   from "../services/ventasService";
import { obtenerGastos }   from "../services/gastosService";
import { obtenerLlenados } from "../services/llenadoService";
import { formatPeso, dayKey } from "../utils/format";

// ── Helpers ────────────────────────────────────────────────────────────────
const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const cantProd = (items, prod) => {
    const found = items?.find((i) => i.producto === prod);
    return found ? found.cantidad : 0;
};

// ── Badge de método de pago ────────────────────────────────────────────────
const MetodoBadge = ({ metodo }) => {
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
const TablaVentas = ({ ventas }) => {
    if (ventas.length === 0) return (
        <p className="text-center py-8 text-sm text-slate-400">Sin ventas para este dia.</p>
    );

    const totalDia = ventas.reduce((acc, v) => acc + v.total, 0);

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
                <thead>
                    <tr className="bg-slate-100 text-slate-600 text-xs uppercase tracking-wider">
                        <th className="text-left px-4 py-3 rounded-tl-xl font-semibold">Cliente</th>
                        <th className="text-center px-3 py-3 font-semibold">20 L</th>
                        <th className="text-center px-3 py-3 font-semibold">12 L</th>
                        <th className="text-center px-3 py-3 font-semibold">Soda</th>
                        <th className="text-right px-4 py-3 font-semibold">Total</th>
                        <th className="text-center px-4 py-3 rounded-tr-xl font-semibold">Pago</th>
                    </tr>
                </thead>
                <tbody>
                    {ventas.map((v) => (
                        <tr
                            key={v._id}
                            className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${
                                v.metodo_pago === "fiado" ? "bg-red-50/40" : ""
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
                            <td className="text-center px-3 py-3 font-bold text-slate-700">
                                {cantProd(v.items, "Bidon 20L") || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="text-center px-3 py-3 font-bold text-slate-700">
                                {cantProd(v.items, "Bidon 12L") || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="text-center px-3 py-3 font-bold text-slate-700">
                                {cantProd(v.items, "Soda") || <span className="text-slate-300">—</span>}
                            </td>
                            <td className="text-right px-4 py-3 font-bold text-slate-800">
                                {formatPeso(v.total)}
                            </td>
                            <td className="text-center px-4 py-3">
                                <MetodoBadge metodo={v.metodo_pago} />
                            </td>
                        </tr>
                    ))}
                </tbody>
                {/* Fila de totales */}
                <tfoot>
                    <tr className="bg-slate-100 font-bold text-slate-800 text-sm">
                        <td className="px-4 py-3 rounded-bl-xl">
                            TOTAL DIA
                            <span className="ml-2 text-xs font-normal text-slate-500">({ventas.length} ventas)</span>
                        </td>
                        <td className="text-center px-3 py-3">
                            {ventas.reduce((acc, v) => acc + cantProd(v.items, "Bidon 20L"), 0) || "—"}
                        </td>
                        <td className="text-center px-3 py-3">
                            {ventas.reduce((acc, v) => acc + cantProd(v.items, "Bidon 12L"), 0) || "—"}
                        </td>
                        <td className="text-center px-3 py-3">
                            {ventas.reduce((acc, v) => acc + cantProd(v.items, "Soda"), 0) || "—"}
                        </td>
                        <td className="text-right px-4 py-3 text-blue-700 rounded-br-xl" colSpan={2}>
                            {formatPeso(totalDia)}
                        </td>
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

// ── SECCIÓN 2 Derecha: Arqueo de caja ────────────────────────────────────
const ArqueoCaja = ({ ventas, gastos }) => {
    const ingresosEfectivo    = ventas.filter((v) => v.metodo_pago === "efectivo").reduce((acc, v) => acc + v.total, 0);
    const ingresosTransferencia = ventas.filter((v) => v.metodo_pago === "transferencia").reduce((acc, v) => acc + v.total, 0);
    const totalFiado          = ventas.filter((v) => v.metodo_pago === "fiado").reduce((acc, v) => acc + v.total, 0);
    const totalIngresos       = ingresosEfectivo + ingresosTransferencia;
    const totalEgresos        = gastos.reduce((acc, g) => acc + g.monto, 0);
    const cajaFinal           = totalIngresos - totalEgresos;

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
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Ingresos</p>
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
                        Fiado
                        <span className="text-xs bg-red-900 text-red-300 px-1.5 py-0.5 rounded">no cobrado</span>
                    </p>
                    <p className="text-sm font-bold text-red-400">{formatPeso(totalFiado)}</p>
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
                        <p className="text-xs text-slate-500 mt-1">Efectivo + Transf. - Gastos</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ── Página principal ───────────────────────────────────────────────────────
const PlanillaPage = () => {
    const [fecha,    setFecha]    = useState(hoy());
    const [ventas,   setVentas]   = useState([]);
    const [gastos,   setGastos]   = useState([]);
    const [llenados, setLlenados] = useState([]);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                setError(null);
                const [{ data: v }, { data: g }, { data: l }] = await Promise.all([
                    obtenerVentas(),
                    obtenerGastos(),
                    obtenerLlenados(),
                ]);
                setVentas(v);
                setGastos(g);
                setLlenados(l);
            } catch {
                setError("No se pudo conectar con el servidor.");
            } finally {
                setCargando(false);
            }
        };
        cargar();
    }, []);

    // Filtrar por día seleccionado
    const ventasDia   = useMemo(() => ventas.filter((v)   => dayKey(v.fecha)   === fecha), [ventas,   fecha]);
    const gastosDia   = useMemo(() => gastos.filter((g)   => dayKey(g.fecha)   === fecha), [gastos,   fecha]);
    const llenadosDia = useMemo(() => llenados.filter((l) => dayKey(l.fecha)   === fecha), [llenados, fecha]);

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
                    {[
                        { label: "Ventas",    valor: ventasDia.length,  sufijo: "entregas",    color: "text-slate-800" },
                        { label: "Facturado", valor: formatPeso(ventasDia.reduce((a,v)=>a+v.total,0)), color: "text-blue-700" },
                        { label: "Gastos",    valor: formatPeso(gastosDia.reduce((a,g)=>a+g.monto,0)), color: "text-orange-600" },
                        { label: "Llenados",  valor: llenadosDia.length, sufijo: "cargas",      color: "text-slate-800" },
                    ].map(({ label, valor, sufijo, color }) => (
                        <div key={label} className="bg-white border border-slate-200 rounded-2xl shadow-sm px-4 py-4">
                            <p className="text-xs text-slate-400 uppercase tracking-wider">{label}</p>
                            <p className={`text-xl font-extrabold mt-1 ${color}`}>
                                {valor}{sufijo && <span className="text-xs font-normal text-slate-400 ml-1">{sufijo}</span>}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {cargando && <p className="text-center py-20 text-slate-400">Cargando datos...</p>}
            {error && !cargando && (
                <div className="max-w-6xl mx-auto bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm">{error}</div>
            )}

            {!cargando && !error && (
                <div className="max-w-6xl mx-auto flex flex-col gap-6">
                    {/* ── SECCIÓN 1: Tabla de ventas ───────────────────── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        <div className="px-6 py-4 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800">Ventas del dia</h2>
                            <p className="text-xs text-slate-400 mt-0.5">Detalle de todas las entregas realizadas</p>
                        </div>
                        <div className="p-2 sm:p-4">
                            <TablaVentas ventas={ventasDia} />
                        </div>
                    </div>

                    {/* ── SECCIÓN 2: Paneles inferiores ────────────────── */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Izquierda: Gastos + Llenados */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-6 py-5">
                            <TablaGastos  gastos={gastosDia} />
                            <TablaLlenados llenados={llenadosDia} />
                        </div>

                        {/* Derecha: Arqueo de caja */}
                        <ArqueoCaja ventas={ventasDia} gastos={gastosDia} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default PlanillaPage;
