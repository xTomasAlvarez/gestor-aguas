import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useConfig } from "../context/ConfigContext";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import api from "../services/api";
import { Building2, Save, ArrowRight, PackageOpen, Plus, Trash2 } from "lucide-react";

const OnboardingPage = () => {
    const { config, recargarConfig } = useConfig();
    const { usuario } = useAuth();
    const navigate = useNavigate();

    const [paso, setPaso] = useState(1); // 1 = Identidad, 2 = Catálogo
    const [form, setForm] = useState({ 
        nombre: "", 
        telefono: "",
        productos: []
    });
    const [cargando, setCargando] = useState(false);

    useEffect(() => {
        // Redirigir si no es admin o si el onboarding ya estaba completo (por seguridad)
        if (usuario?.rol !== "admin" && usuario?.rol !== "superadmin") {
            navigate("/clientes", { replace: true });
            return;
        }
        if (config && config.onboardingCompletado) {
            navigate("/clientes", { replace: true });
            return;
        }
        if (config) {
            setForm({
                nombre: config.nombre === `Empresa de ${usuario?.nombre}` ? "" : config.nombre,
                telefono: config.telefono || "",
                productos: config.productos?.length ? config.productos : [
                    { key: "Bidon 20L", label: "Bidón 20L", precioDefault: 2500 },
                    { key: "Bidon 12L", label: "Bidón 12L", precioDefault: 1800 }
                ]
            });
        }
    }, [config, usuario, navigate]);

    // ── Handlers Paso 1 ──────────────────────────────────────────────
    const handleSiguiente = (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) return toast.error("El nombre es obligatorio");
        setPaso(2);
    };

    // ── Handlers Paso 2 (Productos) ──────────────────────────────────
    const handleAddProd = () => {
        setForm(p => ({
            ...p,
            productos: [...p.productos, { key: "", label: "", precioDefault: 0 }]
        }));
    };

    const handleProdChange = (idx, campo, valor) => {
        const nuevos = [...form.productos];
        nuevos[idx][campo] = campo === "precioDefault" ? Number(valor) : valor;
        // Auto-generar key a partir del label
        if (campo === "label") {
            nuevos[idx].key = valor.trim().replace(/\s+/g, '_').toLowerCase();
        }
        setForm(p => ({ ...p, productos: nuevos }));
    };

    const handleDelProd = (idx) => {
        setForm(p => ({
            ...p,
            productos: p.productos.filter((_, i) => i !== idx)
        }));
    };

    // ── Finalizar Onboarding ─────────────────────────────────────────
    const handleFinalizar = async () => {
        // Validaciones minimas
        if (form.productos.length < 1) return toast.error("Agregá al menos 1 producto para arrancar.");
        for (let prod of form.productos) {
            if (!prod.label || prod.precioDefault <= 0) {
                return toast.error("Asegurate de que todos los productos tengan nombre y precio mayor a 0.");
            }
        }

        setCargando(true);
        const tid = toast.loading("Configurando tu negocio...");
        try {
            await api.put("/config", {
                nombre: form.nombre.trim(),
                telefono: form.telefono.trim(),
                productos: form.productos,
                onboardingCompletado: true
            });
            await recargarConfig();
            toast.success("¡Todo listo! Bienvenido.", { id: tid });
            navigate("/clientes", { replace: true });
        } catch (err) {
            toast.error("Error al finalizar configuración", { id: tid });
            console.error(err);
        } finally {
            setCargando(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors shadow-sm";

    if (config?.cargando) return null;

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
            
            {/* Header / Progreso */}
            <div className="w-full max-w-2xl mb-8 flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-blue-200">
                    <Building2 className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-3xl font-extrabold text-slate-900 mb-2">Configuremos tu Distribuidora</h1>
                <p className="text-slate-500 max-w-md">
                    Completá estos datos básicos para que tu equipo pueda empezar a vender.
                </p>
                
                {/* Dots */}
                <div className="flex items-center gap-2 mt-6">
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${paso >= 1 ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-200'}`} />
                    <div className={`h-2.5 rounded-full transition-all duration-300 ${paso >= 2 ? 'w-8 bg-blue-600' : 'w-2.5 bg-slate-200'}`} />
                </div>
            </div>

            {/* Contenedor Principal */}
            <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
                
                {/* PASO 1: Identidad */}
                {paso === 1 && (
                    <form onSubmit={handleSiguiente} className="p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-3">
                            <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">1</span>
                            Datos del Negocio
                        </h2>
                        
                        <div className="space-y-5">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">¿Cómo se llama tu distribuidora?</label>
                                <input 
                                    type="text" 
                                    autoFocus
                                    value={form.nombre} 
                                    onChange={e => setForm(p => ({ ...p, nombre: e.target.value }))} 
                                    placeholder="Ej: Aguas Cristalinas" 
                                    className={inputCls} 
                                    maxLength={50}
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">WhatsApp / Teléfono de contacto <span className="text-slate-400 font-normal">(opcional)</span></label>
                                <input 
                                    type="text" 
                                    value={form.telefono} 
                                    onChange={e => setForm(p => ({ ...p, telefono: e.target.value }))} 
                                    placeholder="Ej: +54 9 351..." 
                                    className={inputCls} 
                                    maxLength={20}
                                />
                            </div>
                        </div>

                        <div className="mt-10 flex justify-end">
                            <button type="submit" className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-8 py-3.5 rounded-xl font-semibold transition-colors shadow-md">
                                Siguiente <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                    </form>
                )}

                {/* PASO 2: Catálogo */}
                {paso === 2 && (
                    <div className="p-8 sm:p-10 animate-in fade-in slide-in-from-right-8 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-3">
                                <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm">2</span>
                                Tu Catálogo Inical
                            </h2>
                            <button onClick={() => setPaso(1)} className="text-sm font-semibold text-slate-400 hover:text-slate-600 transition-colors">
                                Volver atrás
                            </button>
                        </div>

                        <p className="text-sm text-slate-500 mb-6">
                            Definí los productos base que venden. Más adelante podrás agregar más desde el panel de configuración.
                        </p>

                        <div className="space-y-4 mb-8 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
                            {form.productos.map((prod, idx) => (
                                <div key={idx} className="flex flex-col sm:flex-row gap-3 items-end sm:items-center p-4 bg-slate-50 rounded-2xl border border-slate-200 group transition-colors hover:border-slate-300">
                                    <div className="flex-1 w-full relative">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Producto</label>
                                        <input 
                                            type="text" 
                                            value={prod.label} 
                                            onChange={e => handleProdChange(idx, "label", e.target.value)}
                                            className="w-full px-4 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="Ej: Bidón 12L"
                                        />
                                    </div>
                                    <div className="w-full sm:w-32 relative">
                                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1 ml-1">Precio Unit.</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                                            <input 
                                                type="number" 
                                                value={prod.precioDefault} 
                                                onChange={e => handleProdChange(idx, "precioDefault", e.target.value)}
                                                className="w-full pl-7 pr-3 py-2.5 rounded-lg border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                min="0"
                                            />
                                        </div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => handleDelProd(idx)}
                                        className="h-[42px] px-3 mt-auto sm:mt-0 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center justify-center"
                                        title="Eliminar producto"
                                    >
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>

                        <button 
                            type="button"
                            onClick={handleAddProd}
                            className="w-full py-3 sm:py-4 rounded-2xl border-2 border-dashed border-slate-200 text-slate-500 font-semibold hover:border-blue-300 hover:bg-blue-50 hover:text-blue-600 transition-all flex items-center justify-center gap-2 mb-8"
                        >
                            <Plus className="w-5 h-5" /> Agregar otro producto
                        </button>

                        <div className="flex justify-end pt-4 border-t border-slate-100">
                            <button 
                                onClick={handleFinalizar} 
                                disabled={cargando}
                                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-70 text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-blue-200 transition-all"
                            >
                                {cargando ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                                Finalizar y Entrar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default OnboardingPage;
