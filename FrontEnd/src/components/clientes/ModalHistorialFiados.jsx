import { useState, useEffect } from "react";
import { obtenerVentas } from "../../services/ventasService";
import { formatFecha, formatPeso } from "../../utils/format";
import { Badge, Paper, Stack, Text, Group, Divider } from "@mantine/core";
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
        <Stack gap="sm" style={{ maxHeight: '24rem', overflowY: 'auto' }}>
            {ventas.map(v => {
                const abono = v.monto_pagado || 0;
                const saldo = Math.max(0, v.total - abono);
                const descEstado = v.estado || (saldo > 0 ? "pendiente" : "saldado");
                
                const badgeColor = descEstado === "saldado" ? "teal" : descEstado === "pago_parcial" ? "orange" : "red";
                
                const dev = v.envases_devueltos || {};
                const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
                v.items?.forEach(item => {
                    if (item.producto === "Bidon 20L") prestados.bidones_20L += item.cantidad;
                    if (item.producto === "Bidon 12L") prestados.bidones_12L += item.cantidad;
                    if (item.producto === "Soda")      prestados.sodas       += item.cantidad;
                });

                const falto_20L = Math.max(0, prestados.bidones_20L - (dev.bidones_20L || 0));
                const falto_12L = Math.max(0, prestados.bidones_12L - (dev.bidones_12L || 0));
                const faltosoda = Math.max(0, prestados.sodas - (dev.sodas || 0));
                const tieneEnvasesDeuda = falto_20L > 0 || falto_12L > 0 || faltosoda > 0;

                return (
                    <Paper key={v._id} withBorder p="md" radius="md" bg="slate.50">
                        <Group justify="space-between" mb="xs">
                            <Text size="xs" fw={700} c="dimmed" tt="uppercase" lts={1}>{formatFecha(v.fecha)}</Text>
                            <Badge color={badgeColor} variant="light">
                                {descEstado.replace("_", " ").toUpperCase()}
                            </Badge>
                        </Group>

                        <Group justify="space-between" align="flex-end" mb="xs">
                            <Stack gap={0}>
                                <Text size="xl" fw={900} c={saldo > 0 ? "red.6" : "teal.7"} lh={1}>
                                    {formatPeso(saldo)}
                                </Text>
                                <Text size="xs" c="dimmed" fw={500}>Saldo Monetario</Text>
                            </Stack>
                            {abono > 0 && (
                                <Text size="xs" c="teal.7" fw={700}>Pagado: {formatPeso(abono)}</Text>
                            )}
                        </Group>
                        
                        {(v.items.length > 0 || tieneEnvasesDeuda) && (
                            <>
                                <Divider my="xs" color="slate.200" />
                                <Group gap="xs">
                                    {v.items.length === 0 && <Badge variant="dot" color="gray">Cobranza Simple</Badge>}
                                    {v.items.map((item, i) => (
                                        <Badge key={i} variant="outline" color="blue">
                                            {item.cantidad}x {item.producto}
                                        </Badge>
                                    ))}
                                </Group>
                            </>
                        )}

                        {tieneEnvasesDeuda && (
                            <Paper mt="sm" bg="red.50" px="sm" py="xs" radius="sm">
                                <Text size="xs" c="red.7" fw={700} mb={2}>Envases Pendientes de Retorno:</Text>
                                <Group gap="xs">
                                    {falto_20L > 0 && <Badge size="xs" color="red" variant="filled">{falto_20L}x Bidón 20L</Badge>}
                                    {falto_12L > 0 && <Badge size="xs" color="red" variant="filled">{falto_12L}x Bidón 12L</Badge>}
                                    {faltosoda > 0 && <Badge size="xs" color="red" variant="filled">{faltosoda}x Soda</Badge>}
                                </Group>
                            </Paper>
                        )}
                    </Paper>
                );
            })}
        </Stack>
    );
};

export default ModalHistorialFiados;
