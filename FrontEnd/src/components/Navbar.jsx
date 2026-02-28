import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useConfig } from "../context/ConfigContext";
import ConfirmModal from "./ConfirmModal";

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

const IconConfig = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
);

const IconBroadcast = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.4-1.4A9 9 0 0 0 21 12a9 9 0 0 0-9-9 9 9 0 0 0-9 9 9 9 0 0 0 2.4 6.2L4 19h5" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 12m-1 0a1 1 0 1 0 2 0 1 1 0 1 0-2 0" />
    </svg>
);

const IconMenu = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
    </svg>
);

const IconInventario = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
    </svg>
);

const IconShield = ({ cls }) => (
    <svg viewBox="0 0 24 24" fill="none" strokeWidth={1.8} className={cls}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
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
    const { config }          = useConfig();
    const navigate            = useNavigate();
    const [menuAbierto, setMenuAbierto] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const isSuperAdmin = usuario?.rol === "superadmin";
    const isAdmin = usuario?.rol === "admin" || isSuperAdmin;
    const navLinks  = [
        { to: "/clientes",      label: "Clientes",    Icon: IconClientes  },
        { to: "/ventas",        label: "Ventas",      Icon: IconVentas    },
        { to: "/planilla",      label: "Planilla",    Icon: IconPlanilla  },
        { to: "/llenados",      label: "Llenados",    Icon: IconLlenados  },
        { to: "/gastos",        label: "Gastos",      Icon: IconGastos    },
        { to: "/estadisticas",  label: "Stats",       Icon: IconStats     },
        ...(isAdmin ? [
            { to: "/inventario",   label: "Inventario",Icon: IconInventario },
            { to: "/broadcast",    label: "Difusion",  Icon: IconBroadcast },
            { to: "/configuracion", label: "Config",   Icon: IconConfig    },
        ] : []),
        ...(isSuperAdmin ? [
            { to: "/superadmin",   label: "SuperAdmin", Icon: IconShield   },
        ] : []),
    ];

    // Splitting logic for Mobile Navbar
    const bottomNavKeys = ["/clientes", "/ventas", "/planilla", "/llenados", "/gastos", "/inventario"];
    const bottomNavLinks = navLinks.filter(l => bottomNavKeys.includes(l.to)).slice(0, 6);
    const drawerNavLinks = navLinks.filter(l => !bottomNavKeys.includes(l.to));

    const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

    return (
        <>
            {/* ── TOP BAR (desktop) ──────────────────────────────────── */}
            <div className="pt-4 px-4 pointer-events-none sticky top-0 z-50 flex justify-center">
                <nav className="w-full max-w-6xl bg-white/70 backdrop-blur-md border border-white/60 shadow-glass rounded-2xl pointer-events-auto transition-all">
                    <div className="px-4 sm:px-6 flex items-center justify-between h-16 gap-4 lg:gap-8">
                        {/* El min-w-0 en el padre permite que el truncate del hijo funcione correctamente evitando que rompa el flexbox */}
                        <Link to="/clientes" className="flex items-center gap-2.5 font-display font-bold text-lg tracking-tight text-slate-800 hover:text-blue-600 transition-colors flex-1 md:flex-none min-w-0 pr-2">
                            <span className="w-8 h-8 shrink-0 rounded-xl bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center text-sm font-black text-white shadow-md">
                                {config?.nombre?.[0]?.toUpperCase() || "A"}
                            </span>
                            <span className="truncate max-w-[140px] md:max-w-[200px] lg:max-w-xs">{config?.nombre || "Gestion Reparto"}</span>
                        </Link>

                        {/* Desktop links */}
                        <ul className="hidden sm:flex items-center gap-1.5">
                            {navLinks.map(({ to, label }) => (
                                <li key={to}>
                                    <Link to={to} className={`px-4 py-2 rounded-xl text-sm font-bold transition-all duration-200 ${
                                        pathname === to
                                            ? "bg-blue-600 shadow-md text-white -translate-y-0.5"
                                            : "text-slate-600 hover:bg-white/60 hover:text-blue-700"
                                    }`}>{label}</Link>
                                </li>
                            ))}
                        </ul>

                        {/* Usuario + logout (desktop) */}
                        <div className="hidden sm:flex items-center gap-4 shrink-0">
                            {usuario && <span className="text-sm font-semibold text-slate-600 bg-white/50 px-3 py-1.5 rounded-xl border border-white/60 shadow-sm truncate max-w-[120px]">{usuario.nombre}</span>}
                            <button onClick={() => setShowLogoutConfirm(true)}
                                className="px-4 py-2 text-sm font-bold text-slate-600 border border-slate-200 bg-white/50 rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-all shadow-sm">
                                Salir
                            </button>
                        </div>

                        {/* Mobile: Hamburger Menu Button */}
                        <button
                            className="sm:hidden flex items-center justify-center p-2 rounded-xl text-slate-600 hover:text-blue-600 bg-white/50 border border-white/60 shadow-sm transition-colors"
                            onClick={() => setMenuAbierto((p) => !p)}
                        >
                            <IconMenu cls="w-6 h-6 stroke-current" />
                        </button>
                    </div>

                    {/* Mobile: Drawer / Dropdown */}
                    {menuAbierto && (
                        <div className="sm:hidden bg-white/95 backdrop-blur-xl border-t border-slate-100 rounded-b-2xl shadow-premium relative w-full overflow-hidden animate-fade-in-up">
                            {/* Información del Usuario */}
                            <div className="px-5 py-4 bg-slate-50 border-b border-slate-100">
                                <p className="text-sm font-bold text-slate-800 font-display">{usuario?.nombre}</p>
                                <p className="text-xs font-semibold text-slate-500 mt-0.5">{usuario?.email}</p>
                            </div>
                            
                            {/* Links Secundarios */}
                            <div className="flex flex-col py-3 px-3 gap-1">
                                {drawerNavLinks.map((navItem) => {
                                    const active = pathname === navItem.to;
                                    const DrawerIcon = navItem.Icon;
                                    return (
                                        <Link key={navItem.to} to={navItem.to} onClick={() => setMenuAbierto(false)}
                                            className={`flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-bold transition-colors ${
                                                active ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50"
                                            }`}
                                        >
                                            <DrawerIcon cls="w-5 h-5 stroke-current" />
                                            {navItem.label}
                                        </Link>
                                    );
                                })}
                            </div>

                            {/* Logout Section */}
                            <div className="px-4 py-4 mt-2 border-t border-slate-100">
                                <button onClick={() => { setMenuAbierto(false); setShowLogoutConfirm(true); }}
                                    className="w-full text-sm font-bold text-red-600 bg-red-50 border border-red-100 rounded-xl px-5 py-3 hover:bg-red-600 hover:text-white transition-all text-center">
                                    Cerrar sesión
                                </button>
                            </div>
                        </div>
                    )}
                </nav>
            </div>

            {/* ── BOTTOM TAB BAR (solo mobile) ───────────────────────── */}
            <div className="sm:hidden fixed bottom-4 left-0 right-0 z-40 px-4 w-full flex justify-center pointer-events-none">
                <div className="w-full max-w-sm bg-white/80 backdrop-blur-md border border-white/60 shadow-glass rounded-2xl grid grid-cols-6 gap-1 px-1.5 py-1.5 pb-safe pointer-events-auto transition-all">
                    {bottomNavLinks.map((navItem) => {
                        const active  = pathname === navItem.to;
                        const NavIcon = navItem.Icon;
                        return (
                            <Link key={navItem.to} to={navItem.to}
                                className={`flex flex-col items-center justify-center py-1.5 relative transition-all duration-300 rounded-xl ${
                                    active ? "text-blue-600" : "text-slate-400 hover:text-slate-600"
                                }`}
                            >
                                {/* Fondo activo sutil */}
                                {active && <span className="absolute inset-0 bg-blue-500/10 rounded-xl animate-scale-in" />}
                                
                                <NavIcon cls={`w-6 h-6 stroke-current relative z-10 mb-0.5 ${active ? "stroke-2" : "stroke-[1.8]"}`} />
                                <span className={`text-[10px] leading-none font-bold tracking-tight truncate w-full text-center relative z-10 ${active ? "text-blue-700" : "text-slate-500"}`}>
                                    {navItem.label}
                                </span>
                            </Link>
                        );
                    })}
                </div>
            </div>

            <ConfirmModal
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={handleLogout}
                title="Cerrar sesión"
                message="¿Estás seguro de que deseas salir de tu cuenta?"
                confirmLabel="Salir"
            />
        </>
    );
};

export default Navbar;
