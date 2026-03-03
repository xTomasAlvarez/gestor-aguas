import { useState } from "react";
import TelInput from "./TelInput";
import CounterInput from "../CounterInput";
import { btnPrimary, btnSecondary } from "../../styles/cls";

const FORM_VACIO = { nombre: "", direccion: "", localidad: "", telefono: "", dispensersAsignados: 0 };

const FormCliente = ({ inicial = FORM_VACIO, onGuardar, onCancelar, esEdicion = false }) => {
    const [form,     setForm]     = useState(inicial);
    const [enviando, setEnviando] = useState(false);
    const [error,    setError]    = useState(null);

    const handleChange    = (e)   => { setForm((p) => ({ ...p, [e.target.name]: e.target.value })); setError(null); };
    const handleTelChange = (tel) => { setForm((p) => ({ ...p, telefono: tel })); setError(null); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.nombre.trim()) return setError("El nombre es obligatorio.");
        setEnviando(true);
        try { await onGuardar(form); if (!esEdicion) setForm(FORM_VACIO); }
        catch (err) { setError(err.response?.data?.message || "Error al guardar el cliente."); }
        finally { setEnviando(false); }
    };

    const inputCls = "w-full px-3 py-2.5 rounded-xl border border-slate-200 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition bg-white text-sm";

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <input name="nombre"    value={form.nombre}    onChange={handleChange} placeholder="Nombre y apellido *"  className={inputCls} />
                <input name="direccion" value={form.direccion} onChange={handleChange} placeholder="Direccion" className={inputCls} />
                <input name="localidad" value={form.localidad} onChange={handleChange} placeholder="Localidad" className={inputCls} />
            </div>
            <CounterInput 
                label="Equipos en Cliente"
                description="Dispensers prestados para su uso (Afecta stock en calle)"
                value={form.dispensersAsignados || 0}
                onChange={(val) => setForm((p) => ({ ...p, dispensersAsignados: val }))}
                min={0}
            />
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefono</p>
                <TelInput value={form.telefono} onChange={handleTelChange} />
                {form.telefono && (
                    <p className="text-xs text-slate-400 mt-1">Internacional: <span className="font-mono text-slate-600">+{form.telefono}</span></p>
                )}
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-2.5">{error}</p>}
            <div className="flex gap-2">
                <button type="submit" disabled={enviando} className={btnPrimary}>
                    {enviando ? "Guardando..." : esEdicion ? "Actualizar" : "Guardar cliente"}
                </button>
                {esEdicion && <button type="button" onClick={onCancelar} className={btnSecondary}>Cancelar</button>}
            </div>
        </form>
    );
};

export default FormCliente;
