import { useState, useEffect, useMemo } from "react";
import { Button, Paper, Stack, Text, Group } from "@mantine/core";
import { obtenerVentas } from "../../services/ventasService";
import { formatPeso } from "../../utils/format";
import toast from "react-hot-toast";
import ModalLiquidacion from "./ModalLiquidacion";

const FormCobranza = ({ clienteId, onExito, onCancelar }) => {
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(false);
    const [modalAbierto, setModalAbierto] = useState(false);

    useEffect(() => {
        if (!clienteId) {
            setTickets([]);
            return;
        }
        const cargarTickets = async () => {
            setCargando(true);
            try {
                const { data } = await obtenerVentas();
                // Filtrar tickets del cliente seleccionado que NO estén saldados
                const pendientes = data.filter(v => 
                    (v.cliente?._id === clienteId || v.cliente === clienteId) && 
                    v.estado !== "saldado" &&
                    // Checkeamos también si tiene algo por saldar (deuda de plata o envases en caso de no tener el estado actualizado)
                    ((v.total - (v.monto_pagado || 0) > 0) || (v.metodo_pago === "fiado" && v.items?.length > 0))
                );
                setTickets(pendientes);
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar los tickets adeudados.");
            } finally {
                setCargando(false);
            }
        };
        cargarTickets();
    }, [clienteId]);

    // Calcular total de deuda pendiente
    const totalDeuda = useMemo(() => {
        if (!Array.isArray(tickets)) return 0;
        return tickets.reduce((sum, t) => {
            const saldo = Math.max(0, (t?.total || 0) - (t?.monto_pagado || 0));
            return sum + saldo;
        }, 0);
    }, [tickets]);

    // Obtener nombre del cliente (asumiendo que está en el primer ticket)
    const nombreCliente = useMemo(() => {
        if (tickets.length === 0) return "";
        const primerTicket = tickets[0];
        return primerTicket?.cliente?.nombre || "Cliente";
    }, [tickets]);

    const handleAbrirModal = () => {
        setModalAbierto(true);
    };

    const handleCerrarModal = () => {
        setModalAbierto(false);
    };

    const handleExitoModal = () => {
        // Recargar tickets después de una liquidación exitosa
        if (clienteId) {
            const cargarTickets = async () => {
                setCargando(true);
                try {
                    const { data } = await obtenerVentas();
                    const pendientes = data.filter(v => 
                        (v.cliente?._id === clienteId || v.cliente === clienteId) && 
                        v.estado !== "saldado" &&
                        ((v.total - (v.monto_pagado || 0) > 0) || (v.metodo_pago === "fiado" && v.items?.length > 0))
                    );
                    setTickets(pendientes);
                } catch (err) {
                    console.error(err);
                } finally {
                    setCargando(false);
                }
            };
            cargarTickets();
        }
        
        // Ejecutar callback de éxito del padre
        if (onExito) {
            onExito();
        }
    };

    if (!clienteId) {
        return <p className="text-sm text-slate-400 text-center py-4">Selecciona un cliente arriba para ver sus deudas.</p>;
    }

    return (
        <div className="form-cobranza">
            <Stack gap="md">
                {cargando ? (
                    <Paper withBorder p="md" radius="md">
                        <Text size="sm" c="dimmed" ta="center">
                            Cargando tickets...
                        </Text>
                    </Paper>
                ) : tickets.length === 0 ? (
                    <Paper bg="teal.0" c="teal.7" p="sm" radius="md">
                        <p className="text-sm font-medium text-center">Este cliente no tiene tickets pendientes.</p>
                    </Paper>
                ) : (
                    <Paper
                        withBorder
                        p="md"
                        radius="md"
                        style={{ cursor: 'pointer' }}
                        onClick={handleAbrirModal}
                        bg="blue.0"
                    >
                        <Stack gap="xs">
                            <Text size="lg" fw={700} c="blue.9">
                                {nombreCliente}
                            </Text>
                            <Text size="xl" fw={600} c="red.7">
                                Deuda Total: {formatPeso(totalDeuda)}
                            </Text>
                            <Text size="sm" c="blue.7" fw={500}>
                                Toca para liquidar deuda
                            </Text>
                        </Stack>
                    </Paper>
                )}

                {onCancelar && (
                    <Group justify="flex-end">
                        <Button variant="subtle" color="gray" onClick={onCancelar}>
                            Cancelar
                        </Button>
                    </Group>
                )}
            </Stack>

            {/* Modal de Liquidación */}
            <ModalLiquidacion
                opened={modalAbierto}
                onClose={handleCerrarModal}
                clienteId={clienteId}
                tickets={tickets}
                onExito={handleExitoModal}
            />
        </div>
    );
};

export default FormCobranza;
