import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarService } from "../services/authService";
import { useAuth } from "../context/AuthContext";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User, KeyRound, Building2 } from "lucide-react";

// ── Modos de registro ─────────────────────────────────────────────────────
const MODOS = {
    empleado: "empleado",  // unirse a empresa existente con inviteCode
    admin:    "admin",     // crear empresa nueva con masterCode
};

const RegisterPage = () => {
    const navigate = useNavigate();
    const { login } = useAuth();

    const [modo,      setModo]      = useState(null);          // null = pantalla de selección
    const [form,      setForm]      = useState({
        nombre: "", email: "", password: "", confirmar: "",
        inviteCode:    "",
        nombreEmpresa: "",
        masterCode:    "",
    });
    const [verPass,   setVerPass]   = useState(false);
    const [pendiente, setPendiente] = useState(null); // mensaje de éxito
    const [cargando,  setCargando]  = useState(false);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.password)
            return toast.error("Completa nombre, email y contraseña.");
        if (form.password.length < 6)
            return toast.error("La contraseña debe tener al menos 6 caracteres.");
        if (form.password !== form.confirmar)
            return toast.error("Las contraseñas no coinciden.");
        if (modo === MODOS.empleado && !form.inviteCode)
            return toast.error("Ingresa el código de empresa.");
        if (modo === MODOS.admin && !form.masterCode)
            return toast.error("Ingresa el código de autorización.");

        setCargando(true);
        const tid = toast.loading("Creando cuenta...");
        try {
            const payload =
                modo === MODOS.empleado
                    ? { nombre: form.nombre, email: form.email, password: form.password, inviteCode: form.inviteCode.trim() }
                    : { nombre: form.nombre, email: form.email, password: form.password, masterCode: form.masterCode, nombreEmpresa: form.nombreEmpresa };

            const { data } = await registrarService(payload);
            toast.dismiss(tid);
            
            if (modo === MODOS.admin && data.token) {
                login(data); // Iniciar sesión auto
                toast.success("Cuenta admin creada. Redirigiendo...");
                navigate("/clientes", { replace: true });
            } else {
                setPendiente({ modo, message: data.message, codigo: data.codigoVinculacion });
            }
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al registrarse.", { id: tid });
        } finally {
            setCargando(false);
        }
    };

    const inputCls = (pad = "pl-10") =>
        `w-full ${pad} pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm`;
    const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";
    const iconCls  = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400";

    // ── Pantalla de éxito ─────────────────────────────────────────────────
    if (pendiente) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">
                        {pendiente.modo === MODOS.admin ? "¡Empresa creada!" : "Cuenta creada"}
                    </h2>
                    <p className="text-sm text-slate-500 leading-relaxed">{pendiente.message}</p>
                    {pendiente.codigo && (
                        <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                            <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider mb-1">
                                Código de vinculación para tus empleados
                            </p>
                            <p className="text-2xl font-extrabold text-blue-800 tracking-widest">{pendiente.codigo}</p>
                            <p className="text-xs text-blue-500 mt-1">Guardá este código en un lugar seguro</p>
                        </div>
                    )}
                    <button onClick={() => navigate("/login")}
                        className="mt-6 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors text-sm">
                        Ir al inicio de sesión
                    </button>
                </div>
            </div>
        );
    }

    // ── Selección de modo ─────────────────────────────────────────────────
    if (!modo) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="w-full max-w-sm">
                    <div className="text-center mb-8">
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestor Aguas</h1>
                        <p className="text-sm text-slate-500 mt-2">¿Cómo queres unirte?</p>
                    </div>
                    <div className="flex flex-col gap-3">
                        <button onClick={() => setModo(MODOS.empleado)}
                            className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl px-6 py-5 text-left transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                    <User className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Unirme a una empresa</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Tengo un código de empresa de mi empleador</p>
                                </div>
                            </div>
                        </button>
                        <button onClick={() => setModo(MODOS.admin)}
                            className="w-full bg-white border-2 border-slate-200 hover:border-blue-400 rounded-2xl px-6 py-5 text-left transition-all group">
                            <div className="flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl bg-slate-100 group-hover:bg-blue-50 flex items-center justify-center transition-colors">
                                    <Building2 className="w-5 h-5 text-slate-500 group-hover:text-blue-600" />
                                </div>
                                <div>
                                    <p className="font-bold text-slate-800">Crear empresa nueva</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Soy el administrador y tengo el código de autorización</p>
                                </div>
                            </div>
                        </button>
                    </div>
                    <p className="text-center text-xs text-slate-400 mt-6">
                        ¿Ya tenés cuenta?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">Iniciar sesión</Link>
                    </p>
                </div>
            </div>
        );
    }

    // ── Formulario ────────────────────────────────────────────────────────
    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-6">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestor Aguas</h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {modo === MODOS.empleado ? "Unirme a una empresa" : "Crear empresa nueva"}
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <button onClick={() => setModo(null)}
                        className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 mb-5 transition-colors">
                        <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                        Cambiar modo
                    </button>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Nombre */}
                        <div>
                            <label className={labelCls}>Nombre</label>
                            <div className="relative"><User className={iconCls} />
                                <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                                    placeholder="Juan Perez" className={inputCls()} />
                            </div>
                        </div>
                        {/* Email */}
                        <div>
                            <label className={labelCls}>Email</label>
                            <div className="relative"><Mail className={iconCls} />
                                <input type="email" name="email" value={form.email} onChange={handleChange}
                                    placeholder="tu@email.com" className={inputCls()} />
                            </div>
                        </div>
                        {/* Contraseña */}
                        <div>
                            <label className={labelCls}>Contraseña</label>
                            <div className="relative"><Lock className={iconCls} />
                                <input type={verPass ? "text" : "password"} name="password"
                                    value={form.password} onChange={handleChange}
                                    placeholder="Mín. 6 caracteres" className={`${inputCls()} pr-10`} />
                                <button type="button" tabIndex={-1} onClick={() => setVerPass((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>
                        {/* Confirmar */}
                        <div>
                            <label className={labelCls}>Confirmar contraseña</label>
                            <div className="relative"><Lock className={iconCls} />
                                <input type={verPass ? "text" : "password"} name="confirmar"
                                    value={form.confirmar} onChange={handleChange}
                                    placeholder="Repetí la contraseña" className={inputCls()} />
                            </div>
                        </div>

                        {/* ── Campos según modo ── */}
                        <div className="border-t border-slate-100 pt-4">
                            {modo === MODOS.empleado ? (
                                <div>
                                    <label className={labelCls}>Código de empresa</label>
                                    <p className="text-xs text-slate-400 mb-2">El código de 6 letras que te dio tu administrador</p>
                                    <div className="relative"><KeyRound className={iconCls} />
                                        <input type="text" name="inviteCode" value={form.inviteCode} onChange={handleChange}
                                            placeholder="Ej: AB3K7X" maxLength={6}
                                            className={`${inputCls()} uppercase tracking-widest font-bold`} />
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="mb-3">
                                        <label className={labelCls}>Nombre de la empresa</label>
                                        <div className="relative"><Building2 className={iconCls} />
                                            <input type="text" name="nombreEmpresa" value={form.nombreEmpresa} onChange={handleChange}
                                                placeholder="Ej: Aguas Trancas" className={inputCls()} />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelCls}>Código de autorización</label>
                                        <p className="text-xs text-slate-400 mb-2">Solo los administradores autorizados poseen este código</p>
                                        <div className="relative"><KeyRound className={iconCls} />
                                            <input type="password" name="masterCode" value={form.masterCode} onChange={handleChange}
                                                placeholder="Código de autorización" className={inputCls()} />
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Aviso solo para empleados */}
                        {modo === MODOS.empleado && (
                            <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                                <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                                <p className="text-xs text-blue-700 leading-relaxed">
                                    Tu cuenta quedará pendiente de aprobación. El administrador de la empresa deberá activarla.
                                </p>
                            </div>
                        )}

                        <button type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm mt-1 flex items-center justify-center gap-2">
                            {cargando
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registrando...</>
                                : modo === MODOS.admin ? "Crear empresa" : "Crear cuenta"
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        ¿Ya tenés cuenta?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">Iniciar sesión</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
