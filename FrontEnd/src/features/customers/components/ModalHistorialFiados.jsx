import { useState, useEffect } from "react";
import { obtenerVentas } from "@/features/sales/services/ventasService";
import { Badge, Paper, Stack, Text, Group, Divider } from "@mantine/core";
import { formatFecha, formatPeso } from "@/shared/utils/format";
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
                // Guardar historial completo ledger
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
        <Stack gap="sm" style={{ maxHeight: '32rem', overflowY: 'auto' }}>
            {ventas.map(v => {
                if (!v) return null;
                const estado = String(v.estado || "pendiente").toLowerCase();
                let colorBadge = "red";
                if (estado === "saldado") colorBadge = "teal";
                else if (estado === "pago_parcial") colorBadge = "yellow";

                const envasesArray = Array.isArray(v.envases) ? v.envases : (Array.isArray(v.items) ? v.items : []);
                const devueltosObj = v.envasesDevueltos || v.envases_devueltos || {};

                // Strictly map properties to primitive Numbers
                const ret20L = Number(devueltosObj.bidon20L || devueltosObj.bidones_20L || 0);
                const ret12L = Number(devueltosObj.bidon12L || devueltosObj.bidones_12L || 0);
                const retSoda = Number(devueltosObj.soda || devueltosObj.sodas || 0);
                const showDevueltos = ret20L > 0 || ret12L > 0 || retSoda > 0;

                const montoTotal = Number(v.total || 0);
                const montoAbonado = Number(v.monto_pagado || 0);
                const hasAbono = montoAbonado > 0;
                const hasPrestados = envasesArray.length > 0;

                return (
                    <Paper key={String(v._id || Math.random())} withBorder p="md" radius="md" className="bg-slate-50" mb="sm">
                        <Group justify="space-between" mb="sm">
                            <Text size="sm" fw={700} c="dimmed">
                                {v.fecha ? formatFecha(String(v.fecha)) : 'N/A'}
                            </Text>
                            <Badge color={colorBadge} variant="light">
                                {estado.replace("_", " ").toUpperCase()}
                            </Badge>
                        </Group>
                        
                        <Divider my="sm" color="slate.200" />
                        
                        <Group justify="space-between" align="center" mb="xs">
                            <Stack gap={0}>
                                <Text size="md" fw={700} className="text-slate-800">
                                    {`Monto Total: ${formatPeso(montoTotal)}`}
                                </Text>
                            </Stack>
                            {hasAbono ? (
                                <Text size="sm" fw={600} c="dimmed">
                                    {`Abonado: ${formatPeso(montoAbonado)}`}
                                </Text>
                            ) : null}
                        </Group>

                        {/* Envases Prestados */}
                        {hasPrestados ? (
                            <Group gap="xs" mt="sm">
                                {envasesArray.map((env, i) => (
                                    <Badge key={`env-${i}`} variant="outline" color="blue" size="sm">
                                        {`${Number(env?.cantidad || 0)}x ${String(env?.producto || '')}`}
                                    </Badge>
                                ))}
                            </Group>
                        ) : null}

                        {/* Envases Devueltos */}
                        {showDevueltos ? (
                            <Paper mt="sm" p="xs" className="bg-teal-50" radius="sm">
                                <Text size="xs" fw={700} c="teal.8" mb={4}>Envases Devueltos (Liquidados):</Text>
                                <Group gap="xs">
                                    {ret20L > 0 ? <Text size="xs" fw={600} c="teal.7">{`${ret20L}x Bidón 20L`}</Text> : null}
                                    {ret12L > 0 ? <Text size="xs" fw={600} c="teal.7">{`${ret12L}x Bidón 12L`}</Text> : null}
                                    {retSoda > 0 ? <Text size="xs" fw={600} c="teal.7">{`${retSoda}x Soda`}</Text> : null}
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
