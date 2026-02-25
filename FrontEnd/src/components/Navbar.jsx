import { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const NAV_LINKS = [
    { to: "/clientes", label: "Clientes"  },
    { to: "/ventas",   label: "Ventas"    },
    { to: "/llenados", label: "Llenados"  },
    { to: "/gastos",   label: "Gastos"    },
];

const Navbar = () => {
    const { pathname } = useLocation();
    const [menuAbierto, setMenuAbierto] = useState(false);

    return (
        <nav className="bg-slate-900 text-white shadow-lg sticky top-0 z-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
                {/* Brand */}
                <Link
                    to="/clientes"
                    className="font-extrabold text-lg tracking-tight text-white hover:text-blue-400 transition-colors"
                >
                    Gestión Reparto
                </Link>

                {/* Desktop links */}
                <ul className="hidden sm:flex gap-1">
                    {NAV_LINKS.map(({ to, label }) => (
                        <li key={to}>
                            <Link
                                to={to}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    pathname === to
                                        ? "bg-blue-700 text-white"
                                        : "text-slate-300 hover:bg-slate-700 hover:text-white"
                                }`}
                            >
                                {label}
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* Mobile: hamburger */}
                <button
                    className="sm:hidden flex flex-col gap-1.5 p-2 rounded-lg hover:bg-slate-700 transition-colors"
                    onClick={() => setMenuAbierto((p) => !p)}
                    aria-label="Abrir menú"
                >
                    <span className="block w-5 h-0.5 bg-white"></span>
                    <span className="block w-5 h-0.5 bg-white"></span>
                    <span className="block w-5 h-0.5 bg-white"></span>
                </button>
            </div>

            {/* Mobile dropdown */}
            {menuAbierto && (
                <div className="sm:hidden bg-slate-800 border-t border-slate-700 px-4 pb-3 pt-2 flex flex-col gap-1">
                    {NAV_LINKS.map(({ to, label }) => (
                        <Link
                            key={to}
                            to={to}
                            onClick={() => setMenuAbierto(false)}
                            className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                                pathname === to
                                    ? "bg-blue-700 text-white"
                                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                            }`}
                        >
                            {label}
                        </Link>
                    ))}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
