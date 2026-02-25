import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginService }      from "../services/authService";
import { useAuth }           from "../context/AuthContext";

const LoginPage = () => {
    const { login } = useAuth();
    const navigate  = useNavigate();

    const [form,     setForm]     = useState({ email: "", password: "" });
    const [error,    setError]    = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleChange = (e) => {
        setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.email || !form.password) return setError("Completa todos los campos.");
        setCargando(true);
        try {
            const { data } = await loginService(form.email, form.password);
            login(data);
            navigate("/clientes", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Error al iniciar sesión.");
        } finally {
            setCargando(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {/* Logo / brand */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion Reparto</h1>
                    <p className="text-sm text-slate-500 mt-2">Inicia sesion para continuar</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Acceder al sistema</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Email
                            </label>
                            <input
                                type="email" name="email" autoComplete="email"
                                value={form.email} onChange={handleChange}
                                placeholder="tu@email.com"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                                Contrasena
                            </label>
                            <input
                                type="password" name="password" autoComplete="current-password"
                                value={form.password} onChange={handleChange}
                                placeholder="••••••••"
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors text-sm mt-2"
                        >
                            {cargando ? "Ingresando..." : "Ingresar"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-slate-400 mt-6">
                        Sin cuenta?{" "}
                        <Link to="/register" className="text-blue-600 hover:underline font-semibold">
                            Registrarse
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
