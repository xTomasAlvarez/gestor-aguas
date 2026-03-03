import { useState, useEffect } from "react";
import { obtenerVentas } from "../../services/ventasService";
import { Badge, Paper, Stack, Text, Group, Divider } from "@mantine/core";
import { formatFecha, formatPeso } from "../../utils/format";
import toast from "react-hot-toast";

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
                    ((v.total - (v.monto_pagado || 0) > 0) || v.metodo_pago === "fiado" || v.estado === "pago_parcial" || v.estado === "pendiente")
                );
                // Evitamos mostrar saldados a menos que su array venga enganchado
                setVentas(fiados.filter(f => f.estado !== "saldado"));
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
        <Stack gap="sm" style={{ maxHeight: '32rem', overflowY: 'auto' }}>
            {ventas.map(v => {
                if (!v) return null;
                const estado = String(v.estado || "pendiente").toLowerCase();
                let colorBadge = "red";
                if (estado === "saldado") colorBadge = "teal";
                else if (estado === "pago_parcial") colorBadge = "yellow";

                const envasesArray = v.envases || v.items || [];
                const devueltosObj = v.envasesDevueltos || v.envases_devueltos || {};

                return (
                    <Paper key={String(v._id || Math.random())} withBorder p="md" radius="md" bg="slate.50" mb="sm">
                        <Group justify="space-between" mb="sm">
                            <Text size="sm" fw={700} c="dimmed">{v.fecha ? formatFecha(v.fecha) : 'N/A'}</Text>
                            <Badge color={colorBadge} variant="light">
                                {estado.replace("_", " ").toUpperCase()}
                            </Badge>
                        </Group>
                        
                        <Divider my="sm" color="slate.200" />
                        
                        <Group justify="space-between" align="center" mb="xs">
                            <Stack gap={0}>
                                <Text size="md" fw={700} c="slate.800">
                                    Monto Total: {formatPeso(Number(v.total || 0))}
                                </Text>
                            </Stack>
                            {(Number(v.monto_pagado || 0) > 0) ? (
                                <Text size="sm" fw={600} c="dimmed">
                                    Abonado: {formatPeso(Number(v.monto_pagado))}
                                </Text>
                            ) : null}
                        </Group>

                        {/* Envases Prestados */}
                        {(Array.isArray(envasesArray) && envasesArray.length > 0) ? (
                            <Group gap="xs" mt="sm">
                                {envasesArray.map((env, i) => (
                                    <Badge key={`env-${i}`} variant="outline" color="blue" size="sm">
                                        {`${Number(env?.cantidad || 0)}x ${String(env?.producto || '')}`}
                                    </Badge>
                                ))}
                            </Group>
                        ) : null}

                        {/* Envases Devueltos */}
                        {(devueltosObj?.bidones_20L > 0 || devueltosObj?.bidones_12L > 0 || devueltosObj?.sodas > 0) ? (
                            <Paper mt="sm" p="xs" bg="teal.50" radius="sm">
                                <Text size="xs" fw={700} c="teal.8" mb={4}>Envases Devueltos (Liquidados):</Text>
                                <Group gap="xs">
                                    {devueltosObj?.bidones_20L > 0 ? <Text size="xs" fw={600} c="teal.7">{`${Number(devueltosObj.bidones_20L)}x Bidón 20L`}</Text> : null}
                                    {devueltosObj?.bidones_12L > 0 ? <Text size="xs" fw={600} c="teal.7">{`${Number(devueltosObj.bidones_12L)}x Bidón 12L`}</Text> : null}
                                    {devueltosObj?.sodas > 0 ? <Text size="xs" fw={600} c="teal.7">{`${Number(devueltosObj.sodas)}x Soda`}</Text> : null}
                                </Group>
                            </Paper>
                        ) : null}
                    </Paper>
                );
            })}
        </Stack>
    );
};

export default ModalHistorialFiados;
