import { useState, useEffect } from "react";
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { getDashboardStats, getAnnualStats } from "@/features/dashboard/services/statsService";
import { obtenerDashboardInventario } from "@/features/inventory/services/inventarioService";
import { formatPeso } from "@/shared/utils/format";
import { DollarSign, Truck, Package, Activity, AlertCircle, Calendar, TrendingUp, ShoppingBag } from "lucide-react";

// ── Paleta corporativa (Aqua-Industrial) ──
const C = {
    azul:   "#2563eb", // blue-600
    azulL:  "#60a5fa", // blue-400
    rojo:   "#ef4444", // red-500
    verde:  "#10b981", // emerald-500
    ambar:  "#f59e0b", // amber-500
    slate:  "#334155", // slate-700
    gris:   "#94a3b8", // slate-400
    naranja:"#f97316"  // orange-500
};

const METODO_COLOR = { efectivo: C.verde, fiado: C.rojo, transferencia: C.azul };
const METODO_LABEL = { efectivo: "Efectivo", fiado: "Fiado", transferencia: "Transfer." };

const TooltipPeso = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl border border-slate-700 text-xs">
            <p className="font-bold mb-1.5 text-slate-300">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-medium drop-shadow-sm">
                    {p.name}: {formatPeso(p.value)}
                </p>
            ))}
        </div>
    );
};

const TooltipCantidad = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl border border-slate-700 text-xs">
            <p className="font-bold mb-1.5 text-slate-300">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-medium">
                    {p.name === "cantidad" ? "Unidades" : p.name}: {p.value}
                </p>
            ))}
        </div>
    );
};

// ── Componentes Visuales ──
const KPICard = ({ title, value, sub, icon: IconComponent, colorClass, bgIconClass }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${bgIconClass} flex items-center justify-center flex-shrink-0`}>
            {IconComponent && <IconComponent className={`w-7 h-7 ${colorClass}`} />}
        </div>
        <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
            <p className={`text-2xl font-black mt-1 tracking-tight ${colorClass}`}>{value}</p>
            {sub && <p className="text-[11px] font-medium text-slate-400 mt-1">{sub}</p>}
        </div>
    </div>
);

const ChartContainer = ({ title, children, extra }) => (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex flex-col">
        <div className="flex justify-between items-center mb-5">
            <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">{title}</h3>
            {extra && <div>{extra}</div>}
        </div>
        <div className="flex-1 min-h-[220px]">
            {children}
        </div>
    </div>
);

// ── Vista anual (tabla mensual + selector de año) ──
const VistaAnual = ({ anual, anioSel, onAnioChange, cargando }) => {
    if (cargando && !anual) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                {[1, 2, 3].map(i => <div key={i} className="bg-slate-200 h-28 rounded-2xl" />)}
            </div>
        );
    }
    if (!anual) return null;

    const productos    = anual.productos    || [];
    const meses        = anual.meses        || [];
    const totales      = anual.totales      || { ingresos: 0, egresos: 0, neto: 0, cantidadVentas: 0, productos: {} };
    const aniosDisp    = anual.aniosDisponibles || [anioSel];
    const unidadesAnio = Object.values(totales.productos || {}).reduce((a, b) => a + b, 0);
    const netoAnual    = totales.neto ?? ((totales.ingresos || 0) - (totales.egresos || 0));
    const netoAnualNeg = netoAnual < 0;

    return (
        <>
            {/* Selector de año + KPIs anuales */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                        <Calendar className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div>
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Resumen anual</p>
                        <p className="text-lg font-extrabold text-slate-800 tracking-tight">Año {anual.anio}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <label htmlFor="selector-anio" className="text-xs font-bold text-slate-500 uppercase tracking-wider">Año</label>
                    <select
                        id="selector-anio"
                        value={anioSel}
                        onChange={(e) => onAnioChange(Number(e.target.value))}
                        className="px-3 py-2 text-sm font-bold rounded-lg bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-300"
                    >
                        {aniosDisp.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <KPICard
                    title={`Total Neto ${anual.anio}`}
                    value={formatPeso(netoAnual)}
                    sub={`Ingresos ${formatPeso(totales.ingresos || 0)} − Egresos ${formatPeso(totales.egresos || 0)}`}
                    icon={TrendingUp}
                    colorClass={netoAnualNeg ? "text-red-600" : "text-emerald-600"}
                    bgIconClass={netoAnualNeg ? "bg-red-100"   : "bg-emerald-100"} />
                <KPICard
                    title="Ventas realizadas"
                    value={`${totales.cantidadVentas}`}
                    sub="Cantidad de operaciones"
                    icon={DollarSign} colorClass="text-blue-600" bgIconClass="bg-blue-100" />
                <KPICard
                    title="Unidades vendidas"
                    value={`${unidadesAnio}`}
                    sub="Total de productos entregados"
                    icon={ShoppingBag} colorClass="text-orange-500" bgIconClass="bg-orange-100" />
            </div>

            {/* Tabla mensual */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-sm font-extrabold text-slate-800 tracking-tight">Desglose mensual</h3>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        {productos.length} {productos.length === 1 ? "producto" : "productos"}
                    </span>
                </div>
                <div className="overflow-x-auto -mx-5 px-5">
                    <table className="w-full text-sm border-collapse">
                        <thead>
                            <tr className="border-b-2 border-slate-200">
                                <th className="text-left py-3 pr-4 text-[11px] font-black text-slate-500 uppercase tracking-wider">Mes</th>
                                {productos.map(p => (
                                    <th key={p.key} className="text-right py-3 px-3 text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                        {p.label}
                                    </th>
                                ))}
                                <th className="text-right py-3 pl-3 text-[11px] font-black text-slate-500 uppercase tracking-wider whitespace-nowrap">
                                    Ventas
                                </th>
                                <th className="text-right py-3 pl-3 text-[11px] font-black text-emerald-600 uppercase tracking-wider whitespace-nowrap">
                                    Total Neto
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {meses.map(m => {
                                const vacio = m.cantidadVentas === 0 && (m.egresos || 0) === 0;
                                const neto  = m.neto ?? ((m.ingresos || 0) - (m.egresos || 0));
                                const netoColor = vacio
                                    ? "text-slate-400"
                                    : neto < 0
                                        ? "text-red-600"
                                        : "text-emerald-600";
                                return (
                                    <tr key={m.mes} className={`border-b border-slate-100 hover:bg-slate-50 transition-colors ${vacio ? "text-slate-400" : "text-slate-700"}`}>
                                        <td className="py-2.5 pr-4 font-bold">{m.nombre}</td>
                                        {productos.map(p => (
                                            <td key={p.key} className="py-2.5 px-3 text-right font-semibold tabular-nums">
                                                {m.productos?.[p.key] || 0}
                                            </td>
                                        ))}
                                        <td className="py-2.5 pl-3 text-right font-semibold tabular-nums">
                                            {m.cantidadVentas}
                                        </td>
                                        <td className={`py-2.5 pl-3 text-right font-black tabular-nums ${netoColor}`}>
                                            {formatPeso(neto)}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-slate-300 bg-slate-50">
                                <td className="py-3 pr-4 text-xs font-black text-slate-800 uppercase tracking-wider">Total</td>
                                {productos.map(p => (
                                    <td key={p.key} className="py-3 px-3 text-right text-sm font-black text-slate-800 tabular-nums">
                                        {totales.productos?.[p.key] || 0}
                                    </td>
                                ))}
                                <td className="py-3 pl-3 text-right text-sm font-black text-slate-800 tabular-nums">
                                    {totales.cantidadVentas}
                                </td>
                                <td className={`py-3 pl-3 text-right text-sm font-black tabular-nums ${netoAnualNeg ? "text-red-700" : "text-emerald-700"}`}>
                                    {formatPeso(netoAnual)}
                                </td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
                {totales.cantidadVentas === 0 && (
                    <div className="mt-4 text-center text-sm font-medium text-slate-400 py-6 bg-slate-50 rounded-xl border border-slate-100">
                        Sin ventas registradas en {anual.anio}.
                    </div>
                )}
            </div>
        </>
    );
};

// ── Página Principal ──
const DashboardPage = () => {
    const [tiempo, setTiempo] = useState("mes");
    const [stats, setStats] = useState(null);
    const [inv, setInv] = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState(null);

    // Estado específico para la vista anual
    const [anioSel, setAnioSel] = useState(new Date().getFullYear());
    const [anual, setAnual] = useState(null);

    useEffect(() => {
        let isSubscribed = true;

        if (tiempo === "año") {
            setCargando(true);
            getAnnualStats(anioSel)
                .then(res => {
                    if (!isSubscribed) return;
                    setAnual(res.data);
                    setCargando(false);
                })
                .catch(err => {
                    console.error(err);
                    if (isSubscribed) {
                        setError("No se pudieron cargar las métricas anuales.");
                        setCargando(false);
                    }
                });
            return () => { isSubscribed = false; };
        }

        Promise.all([
            getDashboardStats(tiempo),
            obtenerDashboardInventario()
        ]).then(([resStats, resInv]) => {
            if (isSubscribed) {
                setStats(resStats.data);
                setInv(resInv.data);
                setCargando(false);
            }
        }).catch(err => {
            console.error(err);
            if (isSubscribed) {
                setError("No se pudieron cargar las métricas.");
                setCargando(false);
            }
        });

        return () => { isSubscribed = false; };
    }, [tiempo, anioSel]);

    if (error) return <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 text-red-600 font-medium text-center">{error}</div>;

    const navBtnCls = (t) => `px-4 py-2 text-sm font-bold rounded-lg transition-colors ${tiempo === t ? 'bg-slate-800 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`;

    const cambiarTiempo = (t) => {
        setCargando(true);
        setError(null);
        setTiempo(t);
    };

    // Desestructurar Stats
    const { resumenPeriodo, tendencia30Dias, listaRecupero, productosMasVendidos, distribucionPagos } = stats || {};
    const rp = resumenPeriodo || {};
    
    // Preparar Data Inventory
    const invItems = inv?.items || {};
    // Buscamos dinámicamente el item cuyo label (o key) contenga "dispenser"
    const dispenserKey = Object.keys(invItems).find(k => 
        k.toLowerCase().includes('dispenser') || 
        invItems[k].label?.toLowerCase().includes('dispenser')
    );
    const invData = dispenserKey ? invItems[dispenserKey] : { enCalle: 0, enDeposito: 0, valorizacion: 0 };
    const valorizacionTotal = inv?.valorizacionTotal || 0;

    const donutAssetData = [
        { name: "En Depósito", value: invData.enDeposito || 0, color: C.verde },
        { name: "En Clientes", value: invData.enCalle || 0, color: C.ambar }
    ];
    
    const donutCobros = (distribucionPagos || []).map((p) => ({
        name:  METODO_LABEL[p.metodo] || p.metodo,
        value: p.total,
        color: METODO_COLOR[p.metodo] || C.gris,
    }));

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
            <div className="max-w-6xl mx-auto space-y-6">

                {/* Encabezado y Filtros */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Panel Estratégico</h1>
                        <p className="text-sm font-medium text-slate-500 mt-1">Supervisa finanzas y activos físicos en tiempo real.</p>
                    </div>
                    <div className="flex bg-slate-100 p-1 rounded-xl w-max border border-slate-200/60">
                        <button onClick={() => cambiarTiempo("hoy")}    className={navBtnCls("hoy")}>Hoy</button>
                        <button onClick={() => cambiarTiempo("semana")} className={navBtnCls("semana")}>Semana</button>
                        <button onClick={() => cambiarTiempo("mes")}    className={navBtnCls("mes")}>Mes</button>
                        <button onClick={() => cambiarTiempo("año")}    className={navBtnCls("año")}>Año</button>
                    </div>
                </div>

                {tiempo === "año" ? (
                    <VistaAnual
                        anual={anual}
                        anioSel={anioSel}
                        onAnioChange={(a) => { setCargando(true); setError(null); setAnioSel(a); }}
                        cargando={cargando}
                    />
                ) : cargando && !stats ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
                        {[1, 2, 3, 4].map(i => <div key={i} className="bg-slate-200 h-28 rounded-2xl"></div>)}
                    </div>
                ) : (
                    <>
                        {/* ── 1. KPI Cards Rápidos ── */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <KPICard 
                                title="Caja Real (Cobrado)" 
                                value={formatPeso(rp.totalCobrado)} 
                                sub={`${rp.cantidadVentas} ventas procesadas`}
                                icon={DollarSign} colorClass="text-emerald-600" bgIconClass="bg-emerald-100" />
                            <KPICard 
                                title="Deuda Viva Total" 
                                value={formatPeso(rp.deudaGlobal)} 
                                sub={`+${formatPeso(rp.deudaGenerada)} generada en este periodo`}
                                icon={AlertCircle} colorClass="text-red-500" bgIconClass="bg-red-50" />
                            <KPICard 
                                title="Equipos en Calle" 
                                value={`${invData.enCalle} unids`} 
                                sub={`${invData.enDeposito} en depósito listos`}
                                icon={Truck} colorClass="text-orange-500" bgIconClass="bg-orange-100" />
                            <KPICard 
                                title="Valor Inventario" 
                                value={formatPeso(valorizacionTotal)} 
                                sub="Capital físico documentado"
                                icon={Package} colorClass="text-blue-600" bgIconClass="bg-blue-100" />
                        </div>

                        {/* ── 2. Gráficos Principales ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            
                            {/* Tendencia 30 Días */}
                            <ChartContainer title="Flujo de Caja Últimos 30 Días (Pagado vs Fiado)">
                                {tendencia30Dias && tendencia30Dias.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <AreaChart data={tendencia30Dias} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                            <defs>
                                                <linearGradient id="gPagado" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={C.verde} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={C.verde} stopOpacity={0}/>
                                                </linearGradient>
                                                <linearGradient id="gFiado" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor={C.rojo} stopOpacity={0.3}/>
                                                    <stop offset="95%" stopColor={C.rojo} stopOpacity={0}/>
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                                            <XAxis dataKey="fecha" tick={{ fontSize: 10, fill: C.gris, fontWeight: 600 }} tickMargin={10} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fontSize: 10, fill: C.gris, fontWeight: 600 }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} axisLine={false} tickLine={false} />
                                            <Tooltip content={<TooltipPeso />} />
                                            <Legend iconType="circle" wrapperStyle={{ fontSize: 12, fontWeight: 600, paddingTop: '10px' }} />
                                            <Area type="monotone" dataKey="pagado" name="Cobro Real" stroke={C.verde} strokeWidth={3} fillOpacity={1} fill="url(#gPagado)" />
                                            <Area type="monotone" dataKey="fiado" name="Deuda Nueva" stroke={C.rojo} strokeWidth={3} fillOpacity={1} fill="url(#gFiado)" />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="h-full flex items-center justify-center text-sm font-medium text-slate-400">Sin datos en los últimos 30 días</div>
                                )}
                            </ChartContainer>

                            {/* Activos y Recupero */}
                            <div className="flex flex-col gap-6">
                                <ChartContainer title="Distribución de Dispensers Instalados">
                                    <div className="flex h-full items-center">
                                        <div className="w-1/2 h-full">
                                            <ResponsiveContainer width="100%" height={180}>
                                                <PieChart>
                                                    <Pie data={donutAssetData} cx="50%" cy="50%" innerRadius="60%" outerRadius="80%" paddingAngle={4} dataKey="value" stroke="none">
                                                        {donutAssetData.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                    </Pie>
                                                    <Tooltip formatter={(v) => `${v} unids`} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}/>
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="w-1/2 flex flex-col justify-center gap-3 pl-4">
                                            {donutAssetData.map(d => (
                                                <div key={d.name}>
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className="w-3 h-3 rounded-full shadow-sm" style={{ background: d.color }}></span>
                                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">{d.name}</span>
                                                    </div>
                                                    <p className="text-xl font-black text-slate-800 ml-5">{d.value}</p>
                                                </div>
                                            ))}
                                            <div className="mt-2 ml-5">
                                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Valorización</p>
                                                <p className="text-sm font-extrabold text-blue-600 bg-blue-50 px-2 py-1 rounded inline-block">{formatPeso(invData.valorizacion)}</p>
                                            </div>
                                        </div>
                                    </div>
                                </ChartContainer>
                            </div>

                        </div>

                        {/* ── 3. Listas Secundarias y Recupero ── */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            
                            {/* Productos Más Vendidos */}
                            <ChartContainer title="Top Productos">
                                <ResponsiveContainer width="100%" height={200}>
                                    <BarChart data={productosMasVendidos} margin={{ top: 10, right: 0, left: -25, bottom: 0 }} barSize={24}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="producto" tick={{ fontSize: 10, fill: C.slate, fontWeight:600 }} tickFormatter={(v)=>v.replace("Bidon ","").replace("L","L")} axisLine={false} tickLine={false} />
                                        <YAxis tick={{ fontSize: 10, fill: C.gris, fontWeight:600 }} axisLine={false} tickLine={false} />
                                        <Tooltip content={<TooltipCantidad />} cursor={{ fill: '#f8fafc' }} />
                                        <Bar dataKey="cantidad" name="Unidades" radius={[4, 4, 0, 0]}>
                                            {productosMasVendidos?.map((_, i) => <Cell key={i} fill={C.azulL} />)}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </ChartContainer>

                            {/* Distribución de Cobro */}
                            <ChartContainer title="Mix de Recaudación">
                                {donutCobros.length === 0 ? (
                                    <p className="text-center py-16 text-slate-400 text-sm font-medium">Sin datos de cobro</p>
                                ) : (
                                    <>
                                        <ResponsiveContainer width="100%" height={160}>
                                            <PieChart>
                                                <Pie data={donutCobros} cx="50%" cy="50%" innerRadius="55%" outerRadius="80%" paddingAngle={3} dataKey="value" stroke="none">
                                                    {donutCobros.map((e, i) => <Cell key={i} fill={e.color} />)}
                                                </Pie>
                                                <Tooltip formatter={(v) => formatPeso(v)} contentStyle={{ borderRadius: '12px', border:'none', boxShadow:'0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                            </PieChart>
                                        </ResponsiveContainer>
                                        <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-2">
                                            {donutCobros.map((d) => (
                                                <div key={d.name} className="flex items-center gap-1.5 bg-slate-50 px-2 py-1 rounded-md">
                                                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                                                    <span className="text-xs font-semibold text-slate-600">{d.name}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </ChartContainer>

                            {/* Lista de Recupero (Alertas) */}
                            <ChartContainer title="Alertas de Recupero" extra={<span className="bg-red-100 text-red-600 text-[10px] uppercase font-black px-2 py-1 rounded-lg">Top 10 Riesgos</span>}>
                                <p className="text-[11px] font-medium text-slate-500 mb-3 leading-tight">Clientes con equipos instalados sin compras recientes (&gt;20 días).</p>
                                <div className="space-y-2 overflow-y-auto max-h-[180px] pr-1 styled-scrollbar">
                                    {listaRecupero && listaRecupero.length > 0 ? listaRecupero.map(c => (
                                        <div key={c._id} className="flex items-center justify-between bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                            <div className="min-w-0 pr-2">
                                                <p className="text-xs font-bold text-slate-800 truncate">{c.nombre}</p>
                                                <p className="text-[10px] text-red-500 font-semibold">{c.diasInactivo === "N/A" ? "Nunca compró" : `${c.diasInactivo} días sin compras`}</p>
                                            </div>
                                            <div className="flex items-center gap-1.5 flex-shrink-0 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                                <Activity className="w-3.5 h-3.5 text-blue-500" />
                                                <span className="text-xs font-black text-slate-700">{c.dispensersAsignados}</span>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="flex items-center justify-center p-6 text-center text-xs font-medium text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-100">
                                            ¡Excelente! Todos los clientes con equipos están activos.
                                        </div>
                                    )}
                                </div>
                            </ChartContainer>

                        </div>
                    </>
                )}

            </div>

            {/* Micro CSS para el scroll de la lista de recupero interna */}
            <style dangerouslySetInnerHTML={{__html: `
                .styled-scrollbar::-webkit-scrollbar { width: 4px; }
                .styled-scrollbar::-webkit-scrollbar-track { background: transparent; }
                .styled-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
                .styled-scrollbar::-webkit-scrollbar-thumb:hover { background: #94a3b8; }
            `}} />
        </div>
    );
};

export default DashboardPage;
