import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";

// ── Íconos SVG minimalistas ───────────────────────────────────────────────
const IconClientes = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
);
const IconVentas = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
        <rect x="9" y="3" width="6" height="4" rx="1" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
    </svg>
);
const IconPlanilla = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9h18M3 15h18M9 9v12M15 9v12" />
    </svg>
);
const IconLlenados = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v9a2 2 0 0 1-2 2h-3" />
        <circle cx="7.5" cy="17.5" r="2.5" strokeLinecap="round" />
        <circle cx="17.5" cy="17.5" r="2.5" strokeLinecap="round" />
    </svg>
);
const IconGastos = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <circle cx="12" cy="12" r="10" strokeLinecap="round" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01" />
    </svg>
);

const IconStats = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M7 16l4-4 4 4 4-6" />
    </svg>
);

const NAV_LINKS = [
    { to: "/clientes",     label: "Clientes",     Icon: IconClientes  },
    { to: "/ventas",       label: "Ventas",       Icon: IconVentas    },
    { to: "/planilla",     label: "Planilla",     Icon: IconPlanilla  },
    { to: "/llenados",     label: "Llenados",     Icon: IconLlenados  },
    { to: "/gastos",       label: "Gastos",       Icon: IconGastos    },
    { to: "/estadisticas", label: "Stats",        Icon: IconStats     },
];

const Navbar = () => {
    const { pathname }        = useLocation();
    const { usuario, logout } = useAuth();
    const navigate            = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);

    const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

    return (
        <>
            {/* ── TOP BAR (desktop) ──────────────────────────────────── */}
            <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-40">
                <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-14">
                    <Link to="/clientes" className="font-extrabold text-base tracking-tight text-white hover:text-blue-400 transition-colors">
                        Gestion Reparto
                    </Link>

                    {/* Desktop links */}
                    <ul className="hidden sm:flex gap-1">
                        {NAV_LINKS.map(({ to, label }) => (
                            <li key={to}>
                                <Link to={to} className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    pathname === to
                                        ? "bg-blue-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                }`}>{label}</Link>
                            </li>
                        ))}
                    </ul>

                    {/* Usuario + logout (desktop) */}
                    <div className="hidden sm:flex items-center gap-3">
                        {usuario && <span className="text-xs text-slate-400">{usuario.nombre}</span>}
                        <button onClick={handleLogout}
                            className="px-3 py-1.5 text-xs font-semibold text-slate-300 border border-slate-600 rounded-lg hover:bg-slate-700 hover:text-white transition-colors">
                            Cerrar sesion
                        </button>
                    </div>

                    {/* Mobile: user avatar button */}
                    <button
                        className="sm:hidden flex items-center gap-2 px-2.5 py-1.5 rounded-xl hover:bg-slate-700 transition-colors"
                        onClick={() => setMenuAbierto((p) => !p)}
                    >
                        <span className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white">
                            {usuario?.nombre?.[0]?.toUpperCase() || "?"}
                        </span>
                    </button>
                </div>

                {/* Mobile: user dropdown */}
                {menuAbierto && (
                    <div className="sm:hidden bg-slate-800 border-t border-slate-700 px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-white">{usuario?.nombre}</p>
                            <p className="text-xs text-slate-400">{usuario?.email}</p>
                        </div>
                        <button onClick={handleLogout}
                            className="text-xs font-semibold text-slate-300 border border-slate-600 rounded-xl px-4 py-2 hover:bg-slate-700 hover:text-white transition-colors">
                            Cerrar sesion
                        </button>
                    </div>
                )}
            </nav>

            {/* ── BOTTOM TAB BAR (solo mobile) ───────────────────────── */}
            <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-slate-900 border-t border-slate-700 flex">
                {NAV_LINKS.map((navItem) => {
                    const active  = pathname === navItem.to;
                    const NavIcon = navItem.Icon;
                    return (
                        <Link key={navItem.to} to={navItem.to}
                            className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                                active ? "text-blue-400" : "text-slate-500 active:text-slate-300"
                            }`}
                        >
                            <NavIcon cls="w-5 h-5 stroke-current" />
                            <span className={`text-[10px] font-semibold leading-none ${active ? "text-blue-400" : "text-slate-500"}`}>
                                {navItem.label}
                            </span>
                            {active && <span className="absolute bottom-0 w-8 h-0.5 bg-blue-500 rounded-t-full" />}
                        </Link>
                    );
                })}
            </div>
        </>
    );
};

export default Navbar;
