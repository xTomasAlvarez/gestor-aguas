import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarService } from "../services/authService";
import toast from "react-hot-toast";
import { Mail, Lock, Eye, EyeOff, User, KeyRound } from "lucide-react";

const RegisterPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: "", email: "", password: "", confirmar: "", registrationKey: "",
    });
    const [verPass,    setVerPass]    = useState(false);
    const [pendiente,  setPendiente]  = useState(false);
    const [cargando,   setCargando]   = useState(false);

    const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.password || !form.registrationKey)
            return toast.error("Completa todos los campos.");
        if (form.password.length < 6)
            return toast.error("La contrasena debe tener al menos 6 caracteres.");
        if (form.password !== form.confirmar)
            return toast.error("Las contrasenas no coinciden.");

        setCargando(true);
        const tid = toast.loading("Creando cuenta...");
        try {
            await registrarService(form.nombre, form.email, form.password, form.registrationKey);
            toast.success("Cuenta creada. Aguarda aprobacion del administrador.", { id: tid, duration: 6000 });
            setPendiente(true);
        } catch (err) {
            toast.error(err.response?.data?.message || "Error al registrarse.", { id: tid });
        } finally {
            setCargando(false);
        }
    };

    const inputCls  = (pad = "pl-10") => `w-full ${pad} pr-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm`;
    const labelCls  = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";
    const iconCls   = "absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400";

    if (pendiente) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
                <div className="w-full max-w-sm bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-10 text-center">
                    <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-7 h-7 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h2 className="text-xl font-bold text-slate-800 mb-2">Cuenta creada</h2>
                    <p className="text-sm text-slate-500 leading-relaxed">
                        Tu cuenta fue registrada. El administrador debe aprobarla antes de que puedas ingresar al sistema.
                    </p>
                    <button onClick={() => navigate("/login")}
                        className="mt-6 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors text-sm">
                        Ir al inicio de sesion
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestor Aguas</h1>
                    <p className="text-sm text-slate-500 mt-2">Crea tu cuenta de acceso</p>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-5">Nuevo usuario</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        {/* Nombre */}
                        <div>
                            <label className={labelCls}>Nombre</label>
                            <div className="relative">
                                <User className={iconCls} />
                                <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                                    placeholder="Juan Perez" className={inputCls()} />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className={labelCls}>Email</label>
                            <div className="relative">
                                <Mail className={iconCls} />
                                <input type="email" name="email" value={form.email} onChange={handleChange}
                                    placeholder="tu@email.com" className={inputCls()} />
                            </div>
                        </div>

                        {/* Contraseña */}
                        <div>
                            <label className={labelCls}>Contrasena</label>
                            <div className="relative">
                                <Lock className={iconCls} />
                                <input type={verPass ? "text" : "password"} name="password"
                                    value={form.password} onChange={handleChange}
                                    placeholder="Min. 6 caracteres" className={`${inputCls()} pr-10`} />
                                <button type="button" tabIndex={-1}
                                    onClick={() => setVerPass((p) => !p)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors">
                                    {verPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Confirmar */}
                        <div>
                            <label className={labelCls}>Confirmar contrasena</label>
                            <div className="relative">
                                <Lock className={iconCls} />
                                <input type={verPass ? "text" : "password"} name="confirmar"
                                    value={form.confirmar} onChange={handleChange}
                                    placeholder="Repite la contrasena" className={inputCls()} />
                            </div>
                        </div>

                        {/* Clave de invitación */}
                        <div className="border-t border-slate-100 pt-4">
                            <label className={labelCls}>Codigo de invitacion</label>
                            <div className="relative">
                                <KeyRound className={iconCls} />
                                <input type="password" name="registrationKey" value={form.registrationKey}
                                    onChange={handleChange}
                                    placeholder="Solicitar al administrador" className={inputCls()} />
                            </div>
                        </div>

                        {/* Aviso */}
                        <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <svg className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                El administrador debe aprobar tu cuenta antes de que puedas ingresar al sistema.
                            </p>
                        </div>

                        <button type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors text-sm mt-1 flex items-center justify-center gap-2">
                            {cargando
                                ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Registrando...</>
                                : "Crear cuenta"
                            }
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Ya tenes cuenta?{" "}
                        <Link to="/login" className="text-blue-600 hover:underline font-semibold">Iniciar sesion</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
