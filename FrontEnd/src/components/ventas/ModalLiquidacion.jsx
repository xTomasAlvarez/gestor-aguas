import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Stack, NumberInput, NativeSelect, Paper, Group, Text, Checkbox } from "@mantine/core";
import CounterInput from "../CounterInput";
import { registrarCobranza } from "../../services/ventasService";
import { formatPeso, formatFecha } from "../../utils/format";
import toast from "react-hot-toast";

const ModalLiquidacion = ({ opened, onClose, clienteId, tickets, onExito }) => {
    // Estado local aislado del Modal
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [montoAbonado, setMontoAbonado] = useState("");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [envases, setEnvases] = useState({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    const [enviando, setEnviando] = useState(false);

    // Resetear estado cuando se abre/cierra el modal o cambia el cliente
    useEffect(() => {
        if (!opened) {
            setSelectedTickets([]);
            setMontoAbonado("");
            setMetodoPago("efectivo");
            setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
        }
    }, [opened, clienteId]);

    // Calcular el ticket seleccionado (por ahora solo soportamos un ticket a la vez)
    const ticketActual = useMemo(() => {
        if (selectedTickets.length === 0) return null;
        return tickets.find(t => String(t?._id) === String(selectedTickets[0]));
    }, [tickets, selectedTickets]);

    // Calcular límites del ticket seleccionado
    const maxMonto = useMemo(() => {
        if (!ticketActual) return 0;
        return Math.max(0, (ticketActual?.total || 0) - (ticketActual?.monto_pagado || 0));
    }, [ticketActual]);

    const maxEnvases = useMemo(() => {
        const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        if (!ticketActual) return prestados;
        
        const itemsArr = Array.isArray(ticketActual?.items) ? ticketActual.items : [];
        itemsArr.forEach(item => {
            if (item?.producto === "Bidon 20L") prestados.bidones_20L += (item?.cantidad || 0);
            if (item?.producto === "Bidon 12L") prestados.bidones_12L += (item?.cantidad || 0);
            if (item?.producto === "Soda") prestados.sodas += (item?.cantidad || 0);
        });
        
        const devueltos = ticketActual?.envases_devueltos || { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        return {
            bidones_20L: Math.max(0, prestados.bidones_20L - (devueltos.bidones_20L || 0)),
            bidones_12L: Math.max(0, prestados.bidones_12L - (devueltos.bidones_12L || 0)),
            sodas: Math.max(0, prestados.sodas - (devueltos.sodas || 0))
        };
    }, [ticketActual]);

    // Resetear monto y envases cuando cambia el ticket seleccionado
    useEffect(() => {
        setMontoAbonado("");
        setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    }, [selectedTickets]);

    // Calcular total de deuda pendiente
    const totalDeuda = useMemo(() => {
        if (!Array.isArray(tickets)) return 0;
        return tickets.reduce((sum, t) => {
            const saldo = Math.max(0, (t?.total || 0) - (t?.monto_pagado || 0));
            return sum + saldo;
        }, 0);
    }, [tickets]);

    const handleTicketToggle = (ticketId) => {
        setSelectedTickets(prev => {
            // Por ahora solo permitimos seleccionar un ticket a la vez
            if (prev.includes(ticketId)) {
                return prev.filter(id => id !== ticketId);
            } else {
                return [ticketId];
            }
        });
    };

    const handleConfirmar = async () => {
        if (selectedTickets.length === 0) {
            return toast.error("Por favor selecciona un ticket para saldar.");
        }

        const abonoNumeric = Number(montoAbonado) || 0;
        if (abonoNumeric === 0 && envases.bidones_20L === 0 && envases.bidones_12L === 0 && envases.sodas === 0) {
            return toast.error("Debes ingresar un monto o devolver al menos un envase.");
        }

        const payload = {
            clienteId,
            ticketId: selectedTickets[0],
            montoAbonado: abonoNumeric,
            envasesDevueltos: envases,
            metodoPago
        };

        console.log("1. Iniciando petición al backend desde Modal...", payload);
        setEnviando(true);

        try {
            const response = await registrarCobranza(payload);
            console.log("2. Respuesta recibida:", response);
            toast.success("Liquidación registrada correctamente.");
            
            // Cerrar modal
            onClose();
            
            // Ejecutar callback de éxito
            if (onExito) {
                console.log("-> Ejecutando callback onExito()");
                onExito();
            }
        } catch (error) {
            console.error("Error capturado en registrarCobranza:", error);
            const errorMsg = error.response?.data?.message || "Error crítico al procesar la cobranza.";
            toast.error(errorMsg);
            alert(`Fallo en el servidor: ${errorMsg}`);
        } finally {
            setEnviando(false);
        }
    };

    const handleCancelar = () => {
        onClose();
    };

    return (
        <Modal
            opened={opened}
            onClose={onClose}
            title="Liquidación de Deuda"
            size="lg"
            centered
        >
            <Stack gap="md">
                {/* Resumen de deuda total */}
                <Paper bg="blue.0" p="sm" radius="md">
                    <Text size="sm" fw={600} c="blue.9">
                        Deuda Total: {formatPeso(totalDeuda)}
                    </Text>
                </Paper>

                {/* Lista de tickets pendientes */}
                <div>
                    <Text size="sm" fw={500} mb="xs">
                        Tickets Pendientes:
                    </Text>
                    <Stack gap="xs">
                        {tickets.length === 0 ? (
                            <Paper bg="teal.0" c="teal.7" p="sm" radius="md">
                                <Text size="sm" fw={500} ta="center">
                                    Este cliente no tiene tickets pendientes.
                                </Text>
                            </Paper>
                        ) : (
                            tickets.map(ticket => {
                                const saldoMonetario = Math.max(0, (ticket?.total || 0) - (ticket?.monto_pagado || 0));
                                const itemsArr = Array.isArray(ticket?.items) ? ticket.items : [];
                                const strItems = itemsArr.length > 0
                                    ? itemsArr.map(i => `${Number(i?.cantidad || 0)}x ${String(i?.producto || "")}`).join(", ")
                                    : "Cobranza";

                                return (
                                    <Paper
                                        key={ticket._id}
                                        withBorder
                                        p="sm"
                                        radius="md"
                                        style={{ cursor: 'pointer' }}
                                        bg={selectedTickets.includes(ticket._id) ? "blue.0" : "white"}
                                        onClick={() => handleTicketToggle(ticket._id)}
                                    >
                                        <Group justify="space-between" wrap="nowrap">
                                            <Checkbox
                                                checked={selectedTickets.includes(ticket._id)}
                                                onChange={() => handleTicketToggle(ticket._id)}
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <div style={{ flex: 1 }}>
                                                <Text size="sm" fw={500}>
                                                    {formatFecha(ticket?.fecha)}
                                                </Text>
                                                <Text size="xs" c="dimmed">
                                                    {strItems}
                                                </Text>
                                            </div>
                                            <Text size="sm" fw={600} c="red.7">
                                                {formatPeso(saldoMonetario)}
                                            </Text>
                                        </Group>
                                    </Paper>
                                );
                            })
                        )}
                    </Stack>
                </div>

                {/* Configuración de pago - solo si hay un ticket seleccionado */}
                {ticketActual && (
                    <Paper withBorder radius="md" p="md" bg="slate.50">
                        <Stack gap="sm">
                            <Text size="sm" fw={700} c="slate.8">
                                Liquidación Parcial / Total
                            </Text>

                            <NumberInput
                                label="Monto a Pagar ($)"
                                description={`Deuda restante monetaria: ${formatPeso(maxMonto)}`}
                                placeholder="0"
                                value={montoAbonado}
                                onChange={setMontoAbonado}
                                min={0}
                                max={maxMonto}
                                hideControls
                                size="md"
                                onFocus={(e) => e.target.select()}
                                inputMode="numeric"
                            />

                            {montoAbonado !== "" && Number(montoAbonado) > 0 && (
                                <NativeSelect
                                    label="Método de Pago"
                                    required
                                    data={[
                                        { value: 'efectivo', label: 'Efectivo' },
                                        { value: 'transferencia', label: 'Transferencia' }
                                    ]}
                                    value={metodoPago}
                                    onChange={(event) => setMetodoPago(event.currentTarget.value)}
                                />
                            )}

                            {/* Contadores de envases */}
                            {maxEnvases.bidones_20L > 0 && (
                                <CounterInput
                                    label="Devolver Bidones 20L"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.bidones_20L}`}
                                    value={envases.bidones_20L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_20L: val }))}
                                    min={0}
                                    max={maxEnvases.bidones_20L}
                                />
                            )}

                            {maxEnvases.bidones_12L > 0 && (
                                <CounterInput
                                    label="Devolver Bidones 12L"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.bidones_12L}`}
                                    value={envases.bidones_12L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_12L: val }))}
                                    min={0}
                                    max={maxEnvases.bidones_12L}
                                />
                            )}

                            {maxEnvases.sodas > 0 && (
                                <CounterInput
                                    label="Devolver Sodas"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.sodas}`}
                                    value={envases.sodas}
                                    onChange={(val) => setEnvases(p => ({ ...p, sodas: val }))}
                                    min={0}
                                    max={maxEnvases.sodas}
                                />
                            )}
                        </Stack>
                    </Paper>
                )}

                {/* Botones de acción */}
                <Group justify="flex-end" mt="md">
                    <Button
                        variant="subtle"
                        color="gray"
                        onClick={handleCancelar}
                        disabled={enviando}
                    >
                        Cancelar
                    </Button>
                    <Button
                        color="indigo"
                        variant="filled"
                        onClick={handleConfirmar}
                        loading={enviando}
                        disabled={selectedTickets.length === 0}
                    >
                        Confirmar Liquidación
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ModalLiquidacion;
