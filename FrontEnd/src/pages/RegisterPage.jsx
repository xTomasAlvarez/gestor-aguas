import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarService } from "../services/authService";

const RegisterPage = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        nombre: "", email: "", password: "", confirmar: "", registrationKey: "",
    });
    const [estado,   setEstado]   = useState(null);  // null | "pendiente" | "error"
    const [error,    setError]    = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.password || !form.registrationKey)
            return setError("Completa todos los campos.");
        if (form.password.length < 6)
            return setError("La contrasena debe tener al menos 6 caracteres.");
        if (form.password !== form.confirmar)
            return setError("Las contrasenas no coinciden.");

        setCargando(true);
        try {
            await registrarService(form.nombre, form.email, form.password, form.registrationKey);
            setEstado("pendiente");
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrarse.");
        } finally {
            setCargando(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";
    const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";

    // Pantalla de éxito: cuenta creada, pendiente de aprobación
    if (estado === "pendiente") {
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
                        Tu cuenta fue registrada exitosamente. Deberas aguardar la aprobacion del
                        administrador antes de poder ingresar al sistema.
                    </p>
                    <button
                        onClick={() => navigate("/login")}
                        className="mt-6 w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl transition-colors text-sm"
                    >
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
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion Reparto</h1>
                    <p className="text-sm text-slate-500 mt-2">Crea tu cuenta de acceso</p>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-5">Nuevo usuario</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className={labelCls}>Nombre</label>
                            <input type="text" name="nombre" value={form.nombre} onChange={handleChange}
                                placeholder="Juan Perez" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange}
                                placeholder="tu@email.com" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Contrasena</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange}
                                placeholder="Min. 6 caracteres" className={inputCls} />
                        </div>
                        <div>
                            <label className={labelCls}>Confirmar contrasena</label>
                            <input type="password" name="confirmar" value={form.confirmar} onChange={handleChange}
                                placeholder="Repite la contrasena" className={inputCls} />
                        </div>

                        {/* Clave de invitación */}
                        <div className="border-t border-slate-100 pt-4">
                            <label className={labelCls}>Codigo de invitacion</label>
                            <input type="password" name="registrationKey" value={form.registrationKey}
                                onChange={handleChange} placeholder="Solicitar al administrador"
                                className={inputCls} />
                        </div>

                        {/* Aviso de aprobación */}
                        <div className="flex gap-3 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3">
                            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                            </svg>
                            <p className="text-xs text-blue-700 leading-relaxed">
                                Tu cuenta debera ser aprobada por el administrador antes de poder ingresar al sistema.
                            </p>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
                        )}

                        <button type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors text-sm mt-1">
                            {cargando ? "Registrando..." : "Crear cuenta"}
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
