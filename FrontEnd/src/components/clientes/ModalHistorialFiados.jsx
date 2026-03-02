import { useState, useEffect } from "react";
import { obtenerVentas } from "../../services/ventasService";
import { formatFecha, formatPeso } from "../../utils/format";
import toast from "react-hot-toast";
import { Text, Stack, Paper, Group, Badge } from "@mantine/core";

// ── Modal Historial de Fiados ─────────────────────────────────────────────
const ModalHistorialFiados = ({ cliente }) => {
    const [ventas, setVentas] = useState([]);
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        const cargar = async () => {
            try {
                setCargando(true);
                const { data } = await obtenerVentas();
                // Filtrar ventas del cliente específico que tengan deuda de dinero o envases reteniéndose
                const fiados = data.filter(v => 
                    (v.cliente?._id === cliente._id || v.cliente === cliente._id) && 
                    ((v.total - (v.monto_pagado ?? v.total) > 0) || v.metodo_pago === "fiado")
                );
                setVentas(fiados);
            } catch {
                toast.error("Error al cargar el historial de fiados");
            } finally {
                setCargando(false);
            }
        };
        if (cliente) cargar();
    }, [cliente]);

    if (cargando) return <Text ta="center" py="xl" size="sm" c="dimmed">Cargando historial...</Text>;
    if (ventas.length === 0) return <Text ta="center" py="xl" size="sm" c="dimmed">Este cliente no tiene tickets impagos registrados.</Text>;

    return (
        <Stack gap="sm" style={{ maxHeight: '384px', overflowY: 'auto' }} pr="xs">
            {ventas.map(v => {
                const abono = v.monto_pagado ?? v.total;
                const saldo = Math.max(0, v.total - abono);
                const tieneEnvases = v.metodo_pago === "fiado" && v.items.length > 0;
                
                return (
                    <Paper key={v._id} withBorder radius="md" p="md" shadow="xs" className="border-red-100">
                        <Group justify="space-between" align="flex-start" mb="xs">
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" style={{ letterSpacing: '0.05em' }}>{formatFecha(v.fecha)}</Text>
                            {saldo > 0 && <Text size="xl" fw={900} c="red.6" lh={1}>{formatPeso(saldo)}</Text>}
                        </Group>
                        <Group gap="xs" mt="sm">
                            {v.items.length === 0 && <Badge color="gray" variant="light" radius="sm">Cobranza (saldo remanente)</Badge>}
                            {v.items.map((item, i) => (
                                <Badge key={i} color="indigo" variant="light" radius="sm">
                                    {item.cantidad}x {item.producto}
                                </Badge>
                            ))}
                            {tieneEnvases && <Text size="11px" fw={700} c="red.5" ml={4} mt={2}>*(Envases en Mora)</Text>}
                        </Group>
                    </Paper>
                );
            })}
        </Stack>
    );
};

export default ModalHistorialFiados;
