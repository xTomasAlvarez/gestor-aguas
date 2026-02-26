const SuspendedPage = () => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
            {/* Ícono */}
            <div className="w-20 h-20 rounded-2xl bg-red-950 border border-red-800 flex items-center justify-center mx-auto mb-6">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}
                    className="w-10 h-10 text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round"
                        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                </svg>
            </div>

            {/* Texto principal */}
            <h1 className="text-2xl font-extrabold text-white tracking-tight mb-2">
                Servicio pausado
            </h1>
            <p className="text-slate-400 text-sm leading-relaxed mb-8">
                Esta instancia ha sido suspendida temporalmente.<br />
                Contactate con el administrador del sistema para regularizar el acceso.
            </p>

            {/* Separador */}
            <div className="border-t border-slate-800 pt-6 space-y-2">
                <p className="text-xs text-slate-600 uppercase tracking-widest font-semibold">
                    ¿Sos el administrador?
                </p>
                <p className="text-xs text-slate-500">
                    Verificá el estado de tu suscripción o comunicáte con soporte técnico.
                </p>
            </div>

            {/* Botón de logout */}
            <button
                onClick={() => {
                    localStorage.removeItem("token");
                    localStorage.removeItem("usuario");
                    window.location.href = "/login";
                }}
                className="mt-8 px-6 py-2.5 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-slate-200 rounded-xl text-sm font-semibold transition-colors">
                Cerrar sesión
            </button>
        </div>
    </div>
);

export default SuspendedPage;
