import { useState, useEffect } from "react";
import { obtenerDashboardInventario, actualizarStock } from "../services/inventarioService";
import { Package, Truck, Warehouse, DollarSign, Activity } from "lucide-react";
import toast from "react-hot-toast";
import { formatPeso } from "../utils/format";

// Diccionario visual
const ASSETS_INFO = {
    bidones20L: { label: "Bidones 20L", color: "blue",  icon: Package },
    bidones12L: { label: "Bidones 12L", color: "cyan",  icon: Package },
    sodas:      { label: "Sodas",       color: "indigo", icon: Package },
    dispensers: { label: "Dispensers",  color: "violet", icon: Activity }
};

const InventarioPage = () => {
    const [dashboard, setDashboard] = useState(null);
    const [cargando, setCargando] = useState(true);

    // Estado para edición en línea (Costo y Total Global)
    const [editMode, setEditMode] = useState(null);
    const [formValues, setFormValues] = useState({ cantidadTotal: "", costoReposicion: "" });

    const cargarDatos = async () => {
        try {
            setCargando(true);
            const res = await obtenerDashboardInventario();
            setDashboard(res.data);
        } catch (err) {
            console.error("Error al cargar inventario:", err);
            toast.error("Error al cargar inventario");
        } finally {
            setCargando(false);
        }
    };

    useEffect(() => {
        cargarDatos();
    }, []);

    const iniciarEdicion = (key, itemData) => {
        setEditMode(key);
        setFormValues({
            cantidadTotal: itemData.total,
            costoReposicion: itemData.costoReposicion
        });
    };

    const guardarEdicion = async (key) => {
        try {
            const payload = {
                [key]: {
                    cantidadTotal: Number(formValues.cantidadTotal),
                    costoReposicion: Number(formValues.costoReposicion)
                }
            };
            await actualizarStock(payload);
            toast.success("Inventario actualizado");
            setEditMode(null);
            await cargarDatos();
        } catch (err) {
            console.error("Error al actualizar:", err);
            toast.error("Error al actualizar");
        }
    };

    if (cargando && !dashboard) {
        return <div className="p-8 text-center text-slate-500">Cargando inventario...</div>;
    }

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8 pb-24 sm:pb-8">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Cabecera */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Control de Stock</h1>
                        <p className="text-sm text-slate-500 mt-1">
                            Supervisa el paradero y valorización de tus activos físicos
                        </p>
                    </div>
                    {/* Tarjeta de resúmen global (Capital Invertido) */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 px-5 py-4 flex items-center gap-4 min-w-[280px]">
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center flex-shrink-0">
                            <DollarSign className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Capital Total Instalado</p>
                            <p className="text-xl font-black text-emerald-700 mt-0.5">
                                {formatPeso(dashboard?.valorizacionTotal || 0)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Grid de Activos */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {Object.entries(ASSETS_INFO).map(([key, info]) => {
                        const data = dashboard?.items[key];
                        if (!data) return null;
                        
                        const isEditing = editMode === key;

                        return (
                            <div key={key} className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden flex flex-col">
                                
                                {/* Header del Activo */}
                                <div className={`bg-${info.color}-50 px-6 py-4 flex items-center justify-between border-b border-${info.color}-100`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-xl bg-${info.color}-200 flex items-center justify-center`}>
                                            <info.icon className={`w-5 h-5 text-${info.color}-700`} />
                                        </div>
                                        <h2 className={`text-lg font-bold text-${info.color}-900`}>{info.label}</h2>
                                    </div>
                                    {!isEditing ? (
                                        <button onClick={() => iniciarEdicion(key, data)}
                                            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">
                                            Ajustar Base
                                        </button>
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <button onClick={() => setEditMode(null)} className="text-xs font-bold px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-200 transition-colors">Cancelar</button>
                                            <button onClick={() => guardarEdicion(key)} className="text-xs font-bold px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-sm transition-colors">Guardar</button>
                                        </div>
                                    )}
                                </div>

                                {/* Cuerpo de Datos */}
                                <div className="p-6 grid grid-cols-2 gap-y-6 gap-x-4">
                                    {/* Globales Editables */}
                                    <div className="col-span-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Stock Global Base</p>
                                        {isEditing ? (
                                            <input type="number" inputMode="numeric" min="0"
                                                value={formValues.cantidadTotal === 0 ? "" : formValues.cantidadTotal}
                                                onChange={(e) => setFormValues(p => ({ ...p, cantidadTotal: e.target.value }))}
                                                placeholder="0"
                                                className="w-full text-lg font-extrabold text-slate-900 border-b-2 border-blue-400 focus:outline-none py-1 bg-slate-50/50" />
                                        ) : (
                                            <p className="text-2xl font-black text-slate-800">{data.total} <span className="text-sm font-semibold text-slate-400">unids</span></p>
                                        )}
                                    </div>

                                    <div className="col-span-1">
                                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Costo Reposición</p>
                                        {isEditing ? (
                                            <input type="number" inputMode="numeric" min="0" step="100"
                                                value={formValues.costoReposicion === 0 ? "" : formValues.costoReposicion}
                                                onChange={(e) => setFormValues(p => ({ ...p, costoReposicion: e.target.value }))}
                                                placeholder="$0"
                                                className="w-full text-lg font-extrabold text-slate-900 border-b-2 border-blue-400 focus:outline-none py-1 bg-slate-50/50" />
                                        ) : (
                                            <p className="text-lg font-bold text-slate-700 mt-1">{formatPeso(data.costoReposicion)} <span className="text-xs text-slate-400 font-normal">/c.u</span></p>
                                        )}
                                    </div>

                                    {/* Distribución (Sólo lectura) */}
                                    <div className="col-span-2 grid grid-cols-2 bg-slate-50 rounded-2xl p-4 mt-2">
                                        <div className="border-r border-slate-200">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Warehouse className="w-4 h-4 text-emerald-600" />
                                                <p className="text-xs font-bold text-slate-600 uppercase">En Depósito</p>
                                            </div>
                                            <p className="text-xl font-black text-emerald-700">{data.enDeposito}</p>
                                        </div>
                                        <div className="pl-4">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Truck className="w-4 h-4 text-orange-500" />
                                                <p className="text-xs font-bold text-slate-600 uppercase">En Clientes</p>
                                            </div>
                                            <p className="text-xl font-black text-orange-600">{data.enCalle}</p>
                                        </div>
                                    </div>

                                    {/* Subtotal Valorización */}
                                    <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs font-semibold text-slate-500">Valorización total del lote:</span>
                                        <span className="text-sm font-black text-slate-800">{formatPeso(data.valorizacion)}</span>
                                    </div>

                                </div>
                            </div>
                        );
                    })}
                </div>

            </div>
        </div>
    );
};

export default InventarioPage;
