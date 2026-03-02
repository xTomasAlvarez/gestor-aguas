import { useState } from "react";
import TelInput from "./TelInput";
import { Button, TextInput, Group, Text, ActionIcon } from "@mantine/core";

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

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                <TextInput name="nombre"    value={form.nombre}    onChange={handleChange} placeholder="Nombre y apellido *" required />
                <TextInput name="direccion" value={form.direccion} onChange={handleChange} placeholder="Direccion" />
                <TextInput name="localidad" value={form.localidad} onChange={handleChange} placeholder="Localidad" />
            </div>
            <div className="flex gap-4 items-center bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 mt-2">
                <div className="flex-1">
                    <Text size="sm" fw={700} c="dark.9">Equipos en Cliente</Text>
                    <Text size="10px" c="dimmed" mt={2}>Dispensers prestados para su uso (Afecta stock en calle)</Text>
                </div>
                <Group gap="xs" align="center">
                    <ActionIcon variant="light" color="indigo" size="lg" radius="xl" onClick={() => setForm(p => ({ ...p, dispensersAsignados: Math.max(0, (p.dispensersAsignados || 0) - 1) }))}>
                        -
                    </ActionIcon>
                    <Text size="md" fw={900} w={24} ta="center" className="tabular-nums">{form.dispensersAsignados || 0}</Text>
                    <ActionIcon variant="light" color="indigo" size="lg" radius="xl" onClick={() => setForm(p => ({ ...p, dispensersAsignados: (p.dispensersAsignados || 0) + 1 }))}>
                        +
                    </ActionIcon>
                </Group>
            </div>
            <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Telefono</p>
                <TelInput value={form.telefono} onChange={handleTelChange} />
                {form.telefono && (
                    <p className="text-xs text-slate-500 mt-1">Internacional: <span className="font-mono text-slate-900">+{form.telefono}</span></p>
                )}
            </div>
            {error && <Text size="sm" c="red.7" bg="red.0" px="md" py="xs" className="rounded-xl border border-red-200">{error}</Text>}
            <Group gap="sm" mt="md">
                <Button type="submit" loading={enviando} color="indigo" radius="md">
                    {esEdicion ? "Actualizar" : "Guardar cliente"}
                </Button>
                {esEdicion && <Button type="button" onClick={onCancelar} variant="subtle" color="gray" radius="md">Cancelar</Button>}
            </Group>
        </form>
    );
};

export default FormCliente;
