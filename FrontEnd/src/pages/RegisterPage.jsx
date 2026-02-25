import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { registrarService }  from "../services/authService";
import { useAuth }           from "../context/AuthContext";

const ROL_OPTS = [
    { value: "empleado", label: "Empleado" },
    { value: "admin",    label: "Administrador" },
];

const RegisterPage = () => {
    const { login } = useAuth();
    const navigate  = useNavigate();

    const [form,     setForm]     = useState({ nombre: "", email: "", password: "", confirmar: "", rol: "empleado" });
    const [error,    setError]    = useState(null);
    const [cargando, setCargando] = useState(false);

    const handleChange = (e) => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre || !form.email || !form.password) return setError("Completa todos los campos.");
        if (form.password.length < 6) return setError("La contrasena debe tener al menos 6 caracteres.");
        if (form.password !== form.confirmar) return setError("Las contrasenas no coinciden.");
        setCargando(true);
        try {
            const { data } = await registrarService(form.nombre, form.email, form.password, form.rol);
            login(data);
            navigate("/clientes", { replace: true });
        } catch (err) {
            setError(err.response?.data?.message || "Error al registrarse.");
        } finally {
            setCargando(false);
        }
    };

    const inputCls = "w-full px-4 py-3 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";
    const labelCls = "block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1";

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-12">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Gestion Reparto</h1>
                    <p className="text-sm text-slate-500 mt-2">Crea tu cuenta de acceso</p>
                </div>

                <div className="bg-white rounded-2xl shadow-md border border-slate-200 px-8 py-8">
                    <h2 className="text-lg font-bold text-slate-800 mb-6">Nuevo usuario</h2>

                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div><label className={labelCls}>Nombre</label>
                            <input type="text" name="nombre" value={form.nombre} onChange={handleChange} placeholder="Juan Perez" className={inputCls} /></div>
                        <div><label className={labelCls}>Email</label>
                            <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="tu@email.com" className={inputCls} /></div>
                        <div><label className={labelCls}>Contrasena</label>
                            <input type="password" name="password" value={form.password} onChange={handleChange} placeholder="Min. 6 caracteres" className={inputCls} /></div>
                        <div><label className={labelCls}>Confirmar contrasena</label>
                            <input type="password" name="confirmar" value={form.confirmar} onChange={handleChange} placeholder="Repite la contrasena" className={inputCls} /></div>
                        <div><label className={labelCls}>Rol</label>
                            <select name="rol" value={form.rol} onChange={handleChange} className={inputCls}>
                                {ROL_OPTS.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
                            </select>
                        </div>

                        {error && (
                            <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
                        )}

                        <button type="submit" disabled={cargando}
                            className="w-full py-3 bg-blue-700 hover:bg-blue-800 disabled:bg-blue-300 text-white font-bold rounded-xl transition-colors text-sm mt-2">
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
