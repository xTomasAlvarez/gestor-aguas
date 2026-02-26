import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginService } from "../services/authService";
import { useAuth }      from "../context/AuthContext";
import toast            from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, Download } from "lucide-react";
import useInstallPrompt from "../hooks/useInstallPrompt";

const LoginPage = () => {
    const { login } = useAuth();
    const navigate  = useNavigate();
    const { canInstall, promptInstall } = useInstallPrompt();

    const [form,     setForm]     = useState({ email: "", password: "" });
    const [verPass,  setVerPass]  = useState(false);
    const [cargando, setCargando] = useState(false);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) {
            toast.error("Completa todos los campos.");
            return;
        }
        setCargando(true);
        const tid = toast.loading("Ingresando...");
        try {
            const { data } = await loginService(form.email, form.password);
            toast.success("Bienvenido, " + data.usuario.nombre, { id: tid });
            login(data);
            navigate("/clientes", { replace: true });
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al iniciar sesion.", { id: tid });
        } finally {
            setCargando(false);
        }
    };

    const inputBase = "w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";
    const labelCls  = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion Reparto</h1>
                    <p className="text-sm text-slate-500 mt-2">Inicia sesion para continuar</p>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Acceder al sistema</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Email */}
                        <div>
                            <label className={labelCls}>Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type="email" name="email" autoComplete="email"
                                    value={form.email} onChange={handleChange}
                                    placeholder="tu@email.com" className={inputBase} />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className={labelCls}>Contrasena</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input type={verPass ? "text" : "password"} name="password"
                                    autoComplete="current-password"
                                    value={form.password} onChange={handleChange}
                                    placeholder="••••••••" className={`${inputBase} pr-10`} />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setVerPass((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm mt-2 flex items-center justify-center gap-2">
                            {cargando
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Ingresando...</>
                                : "Ingresar"
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Sin cuenta?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline font-semibold">Registrarse</Link>
                    </p>
                </div>

                {/* Banner de instalación PWA */}
                {canInstall && (
                    <button onClick={promptInstall}
                        className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-slate-200 bg-white text-slate-600 text-sm font-semibold hover:bg-slate-50 hover:border-blue-300 transition-colors shadow-sm">
                        <Download className="w-4 h-4 text-blue-600" />
                        Instalar app en este dispositivo
                    </button>
                )}
            </div>
        </div>
    );
};

export default LoginPage;
