import { useState, useCallback, useEffect } from "react";
import { obtenerInactivos, toggleEstadoCliente } from "../../services/clienteService";
import toast from "react-hot-toast";
import { RotateCcw } from "lucide-react";
import { TextInput, Button, Text, Group, Avatar, Stack } from "@mantine/core";

// ── Modal de clientes inactivos ───────────────────────────────────────────
const ModalInactivos = ({ onReactivar }) => {
    const [inactivos,  setInactivos]  = useState([]);
    const [cargando,   setCargando]   = useState(true);
    const [busqueda,   setBusqueda]   = useState("");
    const [procesando, setProcesando] = useState(null);

    const cargar = useCallback(async (nombre = "") => {
        try {
            setCargando(true);
            const { data } = await obtenerInactivos(nombre);
            setInactivos(data);
        } catch { toast.error("Error al cargar clientes inactivos."); }
        finally { setCargando(false); }
    }, []);

    useEffect(() => { cargar(); }, [cargar]);
    useEffect(() => {
        const t = setTimeout(() => cargar(busqueda), 350);
        return () => clearTimeout(t);
    }, [busqueda, cargar]);

    const handleReactivar = async (cliente) => {
        setProcesando(cliente._id);
        const tid = toast.loading(`Reactivando a ${cliente.nombre}...`);
        try {
            const { data } = await toggleEstadoCliente(cliente._id);
            toast.success(`${data.cliente.nombre} reactivado correctamente.`, { id: tid });
            setInactivos((prev) => prev.filter((c) => c._id !== cliente._id));
            onReactivar(data.cliente);
        } catch {
            toast.error("Error al reactivar el cliente.", { id: tid });
        } finally {
            setProcesando(null);
        }
    };

    return (
        <Stack gap="md">
            <TextInput 
                placeholder="Buscar inactivo..." 
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                size="md"
                radius="md"
            />

            {cargando ? (
                <Text ta="center" py="xl" size="sm" c="dimmed">Cargando...</Text>
            ) : inactivos.length === 0 ? (
                <Text ta="center" py="xl" size="sm" c="dimmed">No hay clientes inactivos.</Text>
            ) : (
                <Stack gap="sm" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                    {inactivos.map((c) => (
                        <Group key={c._id} wrap="nowrap" align="center" className="py-2 border-b border-slate-50 last:border-0">
                            <Avatar color="indigo" radius="xl" size="md">
                                {c.nombre.charAt(0).toUpperCase()}
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <Text size="sm" fw={600} truncate c="dark.8">{c.nombre}</Text>
                                {(c.direccion || c.localidad) && (
                                    <Text size="xs" c="dimmed" truncate>
                                        {c.direccion}{c.direccion && c.localidad ? " - " : ""}{c.localidad}
                                    </Text>
                                )}
                            </div>
                            <Button
                                onClick={() => handleReactivar(c)}
                                disabled={procesando === c._id}
                                leftSection={<RotateCcw className="w-3.5 h-3.5" />}
                                size="xs"
                                radius="md"
                                color="teal"
                            >
                                {procesando === c._id ? "..." : "Reactivar"}
                            </Button>
                        </Group>
                    ))}
                </Stack>
            )}
        </Stack>
    );
};

export default ModalInactivos;
