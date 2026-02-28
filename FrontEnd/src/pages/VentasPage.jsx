import { useState } from "react";
import { obtenerClientes } from "../services/clienteService";
import { obtenerVentas, crearVenta, actualizarVenta, anularVenta } from "../services/ventasService";
import useListaCrud from "../hooks/useListaCrud";
import FiltroTiempo from "../components/FiltroTiempo";
import Modal from "../components/Modal";
import ConfirmModal from "../components/ConfirmModal";
import SkeletonLoader from "../components/SkeletonLoader";
import toast from "react-hot-toast";
import { formatPeso, groupByDay, filtrarPorTiempo, FILTRO_CONFIG, isoToInputDate } from "../utils/format";
import { btnPrimary } from "../styles/cls";
import { useConfig } from "../context/ConfigContext";

import FormVenta from "../components/ventas/FormVenta";
import AccordionDia from "../components/ventas/AccordionDia";

// Helper para pre-poblar el formulario en modo de edición
const ventaToForm = (v, catProductos) => {
    const prods = {};
    catProductos.forEach(p => { prods[p.key] = { cantidad: 0, precio_unitario: p.precioDefault }; });
    v.items.forEach(({ producto, cantidad, precio_unitario }) => { prods[producto] = { cantidad, precio_unitario }; });
    return {
        cliente:      v.cliente?._id || v.cliente,
        metodo_pago:  v.metodo_pago,
        descuento:    v.descuento,
        productos:    prods,
        monto_pagado: v.monto_pagado ?? "",
        esCobranza:   v.items.length === 0,
        fecha:        isoToInputDate(v.fecha)
    };
};

// ── Página principal ──────────────────────────────────────────────────────
const VentasPage = () => {
    const { config } = useConfig();
    const productosBase = config?.productos || [];

    const { items: ventas,   cargando: cargV, error: errorV, cargar: recargarVentas } =
        useListaCrud(() => obtenerVentas().then((r) => r.data));
    const { items: clientes, cargando: cargC, error: errorC } =
        useListaCrud(() => obtenerClientes().then((r) => r.data));

    const [filtroTiempo,    setFiltroTiempo]    = useState("hoy");
    const [expanded,        setExpanded]        = useState(new Set());
    const [editando,        setEditando]        = useState(null);
    const [modalCrear,      setModalCrear]      = useState(false);
    const [confirmarAnular, setConfirmarAnular] = useState(null); // { id }

    const cargando = cargV || cargC;
    const error    = errorV || errorC;

    const handleFiltro = (val) => { setFiltroTiempo(val); setExpanded(new Set()); };
    const toggleDia = (key) => setExpanded((p) => {
        const n = new Set(p); n.has(key) ? n.delete(key) : n.add(key); return n;
    });

    const handleCrear  = async (payload) => { await crearVenta(payload); await recargarVentas(); setModalCrear(false); };
    const handleEditar = async (payload) => { await actualizarVenta(editando._id, payload); await recargarVentas(); setEditando(null); };
    const handleAnular = async () => {
        const { id } = confirmarAnular;
        await anularVenta(id);
        await recargarVentas();
        toast.success("Venta anulada. La deuda fue revertida.");
    };

    const filtradas    = filtrarPorTiempo(ventas, filtroTiempo);
    const porDia       = groupByDay(filtradas);
    const dias         = Object.keys(porDia).sort().reverse();
    const totalPeriodo = filtradas.reduce((a, v) => a + v.total, 0);
    const totalFiado   = filtradas.filter((v) => v.metodo_pago === "fiado").reduce((a, v) => a + v.total, 0);
    const labelCorto   = FILTRO_CONFIG.find((f) => f.value === filtroTiempo)?.labelCorto || "";

    return (
        <div className="min-h-screen bg-slate-50 px-4 py-8 sm:px-8">
            <div className="max-w-4xl mx-auto mb-6 flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-extrabold text-slate-800">Ventas</h1>
                    <p className="text-sm text-slate-500 mt-1">Registro y control de entregas.</p>
                </div>
                <button onClick={() => setModalCrear(true)} className={`hidden sm:block ${btnPrimary}`}>+ Nueva venta</button>
            </div>

            {/* FAB mobile */}
            <button
                onClick={() => setModalCrear(true)}
                className="sm:hidden fixed bottom-[4.5rem] right-4 z-30 w-14 h-14 rounded-full bg-blue-700 active:bg-blue-800 shadow-lg flex items-center justify-center text-white text-3xl font-bold touch-manipulation select-none"
                aria-label="Nueva venta">+</button>

            <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {[
                    { label: `Ventas ${labelCorto}`,    val: filtradas.length,  fmt: false, cls: "text-slate-800" },
                    { label: `Facturado ${labelCorto}`, val: totalPeriodo,      fmt: true,  cls: "text-slate-800" },
                    { label: `Fiado ${labelCorto}`,     val: totalFiado,        fmt: true,  cls: "text-red-600",  border: "border-red-200", span: true },
                ].map(({ label, val, fmt, cls, border = "border-slate-200", span }) => (
                    <div key={label} className={`bg-white border ${border} rounded-2xl shadow-sm px-4 py-4 text-center ${span ? "col-span-2 sm:col-span-1" : ""}`}>
                        <p className="text-xs text-slate-400 uppercase tracking-wider capitalize">{label}</p>
                        <p className={`text-xl font-extrabold mt-1 ${cls}`}>{fmt ? formatPeso(val) : val}</p>
                    </div>
                ))}
            </div>

            <div className="max-w-4xl mx-auto flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-slate-700">
                    Historial <span className="ml-2 text-sm font-normal text-slate-400">({filtradas.length} registros)</span>
                </h2>
                <FiltroTiempo valor={filtroTiempo} onChange={handleFiltro} />
            </div>

            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                {cargando && <SkeletonLoader lines={3} />}
                {error && !cargando && <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-5 py-4 text-sm font-semibold">{error}</div>}
                {!cargando && !error && dias.length === 0 && <p className="text-center py-16 text-slate-400">Sin ventas para este periodo.</p>}
                {!cargando && !error && dias.map((dk) => (
                    <AccordionDia key={dk} diaKey={dk} items={porDia[dk]}
                        expanded={expanded.has(dk)} onToggle={toggleDia}
                        onEditar={setEditando}
                        onAnular={(id) => setConfirmarAnular({ id })} />
                ))}
            </div>

            <Modal isOpen={modalCrear} onClose={() => setModalCrear(false)} title="Nueva venta" maxWidth="max-w-xl">
                <FormVenta clientes={clientes} productosBase={productosBase} onGuardar={handleCrear} onCancelar={() => setModalCrear(false)} />
            </Modal>
            <Modal isOpen={!!editando} onClose={() => setEditando(null)} title="Editar venta" maxWidth="max-w-xl">
                {editando && (
                    <FormVenta clientes={clientes} productosBase={productosBase} inicial={ventaToForm(editando, productosBase)}
                        onGuardar={handleEditar} onCancelar={() => setEditando(null)} esEdicion />
                )}
            </Modal>

            <ConfirmModal
                isOpen={!!confirmarAnular}
                onClose={() => setConfirmarAnular(null)}
                onConfirm={handleAnular}
                title="Anular venta"
                message="¿Anular esta venta? Si era fiado, se revertirá la deuda del cliente."
                confirmLabel="Anular"
            />
        </div>
    );
};

export default VentasPage;
