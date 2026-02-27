// ── Constantes ────────────────────────────────────────────────────────────
export const MESES = [
    "Enero","Febrero","Marzo","Abril","Mayo","Junio",
    "Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre",
];

export const PRODUCTOS_ENUM = ["Bidon 20L", "Bidon 12L", "Soda"];

// ── Formateo ──────────────────────────────────────────────────────────────
export const hoyLocal = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

export const isoToInputDate = (iso) => {
    if (!iso) return hoyLocal();
    const d = new Date(iso);
    if (isNaN(d)) return hoyLocal();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().slice(0, 10);
};

export const prepararFechaBackend = (fechaStr) => {
    if (!fechaStr) return undefined;
    if (fechaStr.includes("T")) return fechaStr;
    const [y, m, d] = fechaStr.split("-").map(Number);
    const date = new Date();
    date.setFullYear(y, m - 1, d);
    return date.toISOString();
};

export const formatFecha = (iso) =>
    new Date(iso).toLocaleString("es-AR", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });

export const formatFechaDia = (iso) =>
    new Date(iso).toLocaleDateString("es-AR", {
        weekday: "long", day: "2-digit", month: "long",
    });

export const formatPeso = (n) =>
    new Intl.NumberFormat("es-AR", {
        style: "currency", currency: "ARS", maximumFractionDigits: 0,
    }).format(n ?? 0);

// ── Clave de día para agrupar (YYYY-MM-DD) ────────────────────────────────
export const dayKey = (iso) => {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// ── Filtrar por mes y año ─────────────────────────────────────────────────
export const filterByMonth = (items, month, year, campo = "fecha") =>
    items.filter((item) => {
        const d = new Date(item[campo]);
        return d.getMonth() === month && d.getFullYear() === year;
    });

// ── Agrupar por día → { "YYYY-MM-DD": [items] } ──────────────────────────
export const groupByDay = (items, campo = "fecha") =>
    items.reduce((acc, item) => {
        const key = dayKey(item[campo]);
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
    }, {});

// ── Años disponibles en el selector ──────────────────────────────────────
export const getAvailableYears = () => {
    const y = new Date().getFullYear();
    return [y - 1, y, y + 1];
};

// ── Filtrar por rango temporal (hoy / semana / mes) ───────────────────────
export const filtrarPorTiempo = (items, filtro, campo = "fecha") => {
    const ahora    = new Date();
    const inicioDia = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate());

    let desde;
    if (filtro === "hoy") {
        desde = inicioDia;
    } else if (filtro === "semana") {
        // Lunes como inicio de semana
        const dow = ahora.getDay(); // 0=dom, 1=lun, ...
        const diasDesLunes = dow === 0 ? 6 : dow - 1;
        desde = new Date(inicioDia);
        desde.setDate(inicioDia.getDate() - diasDesLunes);
    } else if (filtro === "mes") {
        desde = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    } else {
        return items;
    }

    return items.filter((item) => new Date(item[campo]) >= desde);
};

// ── Labels de filtro ──────────────────────────────────────────────────────
export const FILTRO_CONFIG = [
    { value: "hoy",    label: "Hoy",          labelCorto: "del dia"      },
    { value: "semana", label: "Esta semana",   labelCorto: "de la semana" },
    { value: "mes",    label: "Este mes",      labelCorto: "del mes"      },
];

