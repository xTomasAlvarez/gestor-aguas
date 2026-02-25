import { useState, useEffect } from "react";
import {
    AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { getDashboardStats } from "../services/statsService";
import { formatPeso }        from "../utils/format";

// ── Paleta corporativa ────────────────────────────────────────────────────
const C = {
    azul:   "#1d4ed8",
    azulL:  "#3b82f6",
    rojo:   "#ef4444",
    verde:  "#10b981",
    ambar:  "#f59e0b",
    slate:  "#1e293b",
    gris:   "#64748b",
};

const METODO_COLOR = { efectivo: C.verde, fiado: C.rojo, transferencia: C.azulL };
const METODO_LABEL = { efectivo: "Efectivo", fiado: "Fiado", transferencia: "Transferencia" };

// ── Tooltip personalizado ─────────────────────────────────────────────────
const TooltipPeso = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl text-xs">
            <p className="font-bold mb-1 text-slate-300">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>
                    {p.name}: {formatPeso(p.value)}
                </p>
            ))}
        </div>
    );
};

const TooltipCantidad = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-slate-900 text-white rounded-xl px-4 py-3 shadow-xl text-xs">
            <p className="font-bold mb-1 text-slate-300">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }}>{p.value} unidades</p>
            ))}
        </div>
    );
};

// ── Tarjeta de resumen ────────────────────────────────────────────────────
const StatCard = ({ label, value, sub, colorVal = "text-slate-800", border = "border-slate-200" }) => (
    <div className={`bg-white rounded-2xl border ${border} shadow-sm px-4 py-4`}>
        <p className="text-xs text-slate-400 uppercase tracking-wider font-medium">{label}</p>
        <p className={`text-xl sm:text-2xl font-extrabold mt-1 ${colorVal}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
    </div>
);

// ── Contenedor de gráfico ─────────────────────────────────────────────────
const ChartCard = ({ title, children }) => (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm px-4 pt-5 pb-2">
        <h3 className="text-sm font-bold text-slate-700 mb-4">{title}</h3>
        {children}
    </div>
);

// ── Etiqueta central del donut (porcentaje)
const DonutCenterLabel = ({ viewBox, value }) => {
    const { cx, cy } = viewBox || {};
    return (
        <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central"
            className="fill-slate-800" style={{ fontSize: 14, fontWeight: 700 }}>
            {value}
        </text>
    );
};


// ── Página principal ──────────────────────────────────────────────────────
const DashboardPage = () => {
    const [stats,    setStats]    = useState(null);
    const [cargando, setCargando] = useState(true);
    const [error,    setError]    = useState(null);

    useEffect(() => {
        getDashboardStats()
            .then(({ data }) => setStats(data))
            .catch(() => setError("No se pudieron cargar las estadísticas."))
            .finally(() => setCargando(false));
    }, []);

    if (cargando) return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-slate-400 text-sm">Cargando estadísticas...</p></div>;
    if (error)    return <div className="min-h-screen bg-slate-50 flex items-center justify-center"><p className="text-red-500 text-sm">{error}</p></div>;

    const { resumenMes, evolucion, productosMasVendidos, distribucionPagos } = stats;
    const balance = resumenMes.balance;

    // Donut: total del período para porcentajes
    const donutData = distribucionPagos.map((p) => ({
        name:  METODO_LABEL[p.metodo] || p.metodo,
        value: p.total,
        color: METODO_COLOR[p.metodo] || C.gris,
    }));

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-8">
            <div className="max-w-4xl mx-auto">

                {/* Encabezado */}
                <div className="mb-6">
                    <h1 className="text-2xl font-extrabold text-slate-800">Estadísticas</h1>
                    <p className="text-sm text-slate-500 mt-1">Panel de control del negocio.</p>
                </div>

                {/* Tarjetas de resumen */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    <StatCard
                        label="Ventas del mes"
                        value={formatPeso(resumenMes.totalVentas)}
                        sub={`${resumenMes.cantidadVentas} entregas`} />
                    <StatCard
                        label="Gastos del mes"
                        value={formatPeso(resumenMes.totalGastos)}
                        colorVal="text-red-600"
                        border="border-red-100" />
                    <StatCard
                        label="Balance neto"
                        value={formatPeso(balance)}
                        colorVal={balance >= 0 ? "text-emerald-600" : "text-red-600"}
                        border={balance >= 0 ? "border-emerald-100" : "border-red-100"} />
                    <StatCard
                        label="Deuda fiado"
                        value={formatPeso(resumenMes.deudaTotal)}
                        colorVal="text-amber-600"
                        border="border-amber-100" />
                </div>

                {/* Evolución de ingresos */}
                <ChartCard title="Evolución — Ingresos vs Gastos (6 meses)">
                    <ResponsiveContainer width="100%" height={220}>
                        <AreaChart data={evolucion} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                            <defs>
                                <linearGradient id="gradIng" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={C.azul}  stopOpacity={0.25} />
                                    <stop offset="95%" stopColor={C.azul}  stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="gradGast" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%"  stopColor={C.rojo}  stopOpacity={0.2} />
                                    <stop offset="95%" stopColor={C.rojo}  stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                            <XAxis dataKey="nombre" tick={{ fontSize: 11, fill: C.gris }} />
                            <YAxis tick={{ fontSize: 10, fill: C.gris }} tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                            <Tooltip content={<TooltipPeso />} />
                            <Legend wrapperStyle={{ fontSize: 11 }} />
                            <Area type="monotone" dataKey="ingresos" name="Ingresos" stroke={C.azul} fill="url(#gradIng)" strokeWidth={2} dot={false} />
                            <Area type="monotone" dataKey="gastos"   name="Gastos"   stroke={C.rojo}  fill="url(#gradGast)" strokeWidth={2} dot={false} />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartCard>

                {/* Grid: barras + donut */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">

                    {/* Productos más vendidos */}
                    <ChartCard title="Productos más vendidos">
                        <ResponsiveContainer width="100%" height={200}>
                            <BarChart data={productosMasVendidos} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                <XAxis dataKey="producto" tick={{ fontSize: 10, fill: C.gris }}
                                    tickFormatter={(v) => v.replace("Bidon ", "").replace("L", "L")} />
                                <YAxis tick={{ fontSize: 10, fill: C.gris }} />
                                <Tooltip content={<TooltipCantidad />} />
                                <Bar dataKey="cantidad" name="Unidades" radius={[6, 6, 0, 0]}>
                                    {productosMasVendidos.map((_, i) => (
                                        <Cell key={i} fill={[C.azul, C.azulL, C.gris][i % 3]} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartCard>

                    {/* Distribución de cobranza (Donut) */}
                    <ChartCard title="Distribución de cobranza">
                        {donutData.length === 0 ? (
                            <p className="text-center py-16 text-slate-400 text-sm">Sin datos</p>
                        ) : (
                            <>
                                <ResponsiveContainer width="100%" height={180}>
                                    <PieChart>
                                        <Pie data={donutData} cx="50%" cy="50%"
                                            innerRadius="55%" outerRadius="80%"
                                            dataKey="value" paddingAngle={3}>
                                            {donutData.map((entry, i) => (
                                                <Cell key={i} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(v) => formatPeso(v)} />
                                    </PieChart>
                                </ResponsiveContainer>
                                {/* Leyenda manual */}
                                <div className="flex flex-wrap justify-center gap-3 pb-2">
                                    {donutData.map((d) => (
                                        <div key={d.name} className="flex items-center gap-1.5">
                                            <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: d.color }} />
                                            <span className="text-xs text-slate-600">{d.name}</span>
                                            <span className="text-xs font-bold text-slate-800">{formatPeso(d.value)}</span>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </ChartCard>
                </div>

            </div>
        </div>
    );
};

export default DashboardPage;
