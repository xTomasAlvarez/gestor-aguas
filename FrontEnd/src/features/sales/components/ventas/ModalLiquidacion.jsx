import { useState, useEffect, useMemo } from "react";
import { Modal, Button, Stack, NumberInput, NativeSelect, Paper, Group, Text, Checkbox } from "@mantine/core";
import CounterInput from "@/shared/components/CounterInput";
import { registrarCobranza } from "@/features/sales/services/ventasService";
import { formatPeso, formatFecha } from "@/shared/utils/format";
import toast from "react-hot-toast";

const ModalLiquidacion = ({ opened, onClose, clienteId, tickets, onExito }) => {
    // Estado local aislado del Modal
    const [selectedTickets, setSelectedTickets] = useState([]);
    const [pagosTabla, setPagosTabla] = useState([]);
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [envases, setEnvases] = useState({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    const [enviando, setEnviando] = useState(false);

    // Resetear estado cuando se abre/cierra el modal o cambia el cliente
    useEffect(() => {
        if (!opened) {
            setSelectedTickets([]);
            setPagosTabla([]);
            setMetodoPago("efectivo");
            setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
        }
    }, [opened, clienteId]);

    // Obtener tickets seleccionados como objetos completos
    const ticketsSeleccionados = useMemo(() => {
        return tickets.filter(t => selectedTickets.includes(String(t?._id)));
    }, [tickets, selectedTickets]);

    // Calcular límites totales para múltiples tickets
    const maxMontoTotal = useMemo(() => {
        return ticketsSeleccionados.reduce((sum, ticket) => {
            const deuda = Math.max(0, (ticket?.total || 0) - (ticket?.monto_pagado || 0));
            return sum + deuda;
        }, 0);
    }, [ticketsSeleccionados]);

    // Calcular máximo de envases globales (suma de pendientes de todos los tickets)
    const maxEnvasesGlobal = useMemo(() => {
        const total = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        
        ticketsSeleccionados.forEach(ticket => {
            const itemsArr = Array.isArray(ticket?.items) ? ticket.items : [];
            const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            
            itemsArr.forEach(item => {
                if (item?.producto === "Bidon 20L") prestados.bidones_20L += (item?.cantidad || 0);
                if (item?.producto === "Bidon 12L") prestados.bidones_12L += (item?.cantidad || 0);
                if (item?.producto === "Soda") prestados.sodas += (item?.cantidad || 0);
            });
            
            const devueltos = ticket?.envases_devueltos || { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            
            total.bidones_20L += Math.max(0, prestados.bidones_20L - (devueltos.bidones_20L || 0));
            total.bidones_12L += Math.max(0, prestados.bidones_12L - (devueltos.bidones_12L || 0));
            total.sodas += Math.max(0, prestados.sodas - (devueltos.sodas || 0));
        });
        
        return total;
    }, [ticketsSeleccionados]);

    // Inicializar pagosTabla cuando los tickets seleccionados cambian
    useEffect(() => {
        const nuevosPagos = ticketsSeleccionados.map(ticket => ({
            ticketId: String(ticket?._id),
            monto: 0
        }));
        setPagosTabla(nuevosPagos);
        setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    }, [ticketsSeleccionados]);

    // Calcular suma total de pagos
    const totalPagos = useMemo(() => {
        return pagosTabla.reduce((sum, pago) => sum + (pago.monto || 0), 0);
    }, [pagosTabla]);

    // Calcular total de deuda pendiente
    const totalDeuda = useMemo(() => {
        if (!Array.isArray(tickets)) return 0;
        return tickets.reduce((sum, t) => {
            const saldo = Math.max(0, (t?.total || 0) - (t?.monto_pagado || 0));
            return sum + saldo;
        }, 0);
    }, [tickets]);

    const handleTicketToggle = (ticketId) => {
        // Permitir múltiples selecciones, máximo 10 tickets
        setSelectedTickets(prev => {
            if (prev.includes(ticketId)) {
                // Deseleccionar
                return prev.filter(id => id !== ticketId);
            } else {
                // Seleccionar (si no excedemos máximo de 10)
                if (prev.length >= 10) {
                    toast.error("Máximo 10 tickets por transacción.");
                    return prev;
                }
                return [...prev, ticketId];
            }
        });
    };

    const handleConfirmar = async () => {
        if (selectedTickets.length === 0) {
            return toast.error("Por favor selecciona al menos un ticket para saldar.");
        }

        // Calcular suma total de pagos
        const totalPagos = pagosTabla.reduce((sum, pago) => sum + (pago.monto || 0), 0);
        
        // Validar: debe haber al menos un pago o devolución de envases
        if (totalPagos === 0 && envases.bidones_20L === 0 && envases.bidones_12L === 0 && envases.sodas === 0) {
            return toast.error("Debes ingresar un monto o devolver al menos un envase.");
        }

        // Validar: suma de pagos no puede exceder deuda total
        if (totalPagos > maxMontoTotal) {
            return toast.error(`La suma de pagos ($${totalPagos}) excede la deuda total ($${maxMontoTotal}).`);
        }

        // Construir payload con nueva API (múltiple)
        const payload = {
            clienteId,
            ticketIds: selectedTickets,
            pagos: pagosTabla,
            envasesDevueltos: envases,
            metodoPago
        };

        setEnviando(true);

        try {
            const response = await registrarCobranza(payload);
            toast.success("Liquidación múltiple registrada correctamente.");
            
            // Cerrar modal
            onClose();
            
            // Ejecutar callback de éxito
            if (onExito) {
                onExito();
            }
        } catch (error) {
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

                {/* Configuración de pago - solo si hay tickets seleccionados */}
                {ticketsSeleccionados.length > 0 && (
                    <Paper withBorder radius="md" p="md" bg="slate.50">
                        <Stack gap="sm">
                            <Text size="sm" fw={700} c="slate.8">
                                Distribución de Pagos ({selectedTickets.length} ticket{selectedTickets.length !== 1 ? 's' : ''})
                            </Text>

                            {/* Tabla de distribución manual */}
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid #dee2e6' }}>
                                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', fontWeight: '600' }}>Fecha</th>
                                            <th style={{ textAlign: 'left', padding: '8px', fontSize: '12px', fontWeight: '600' }}>Items</th>
                                            <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', fontWeight: '600' }}>Deuda</th>
                                            <th style={{ textAlign: 'right', padding: '8px', fontSize: '12px', fontWeight: '600' }}>Monto a Pagar</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {ticketsSeleccionados.map((ticket, idx) => {
                                            const deudaRestante = Math.max(0, (ticket?.total || 0) - (ticket?.monto_pagado || 0));
                                            const itemsArr = Array.isArray(ticket?.items) ? ticket.items : [];
                                            const strItems = itemsArr.length > 0
                                                ? itemsArr.map(i => `${Number(i?.cantidad || 0)}x ${String(i?.producto || "")}`).join(", ")
                                                : "Cobranza";
                                            const montoActual = pagosTabla[idx]?.monto || 0;
                                            const estaExcedido = montoActual > deudaRestante;

                                            return (
                                                <tr key={ticket._id} style={{ borderBottom: '1px solid #e9ecef' }}>
                                                    <td style={{ padding: '8px', fontSize: '12px' }}>
                                                        {formatFecha(ticket?.fecha)}
                                                    </td>
                                                    <td style={{ padding: '8px', fontSize: '12px', color: '#495057' }}>
                                                        {strItems}
                                                    </td>
                                                    <td style={{ padding: '8px', fontSize: '12px', textAlign: 'right', fontWeight: '600' }}>
                                                        {formatPeso(deudaRestante)}
                                                    </td>
                                                    <td style={{ padding: '8px', textAlign: 'right' }}>
                                                        <NumberInput
                                                            value={montoActual}
                                                            onChange={(val) => {
                                                                const newPagos = [...pagosTabla];
                                                                newPagos[idx] = { ...newPagos[idx], monto: Number(val) || 0 };
                                                                setPagosTabla(newPagos);
                                                            }}
                                                            min={0}
                                                            max={deudaRestante}
                                                            hideControls
                                                            size="sm"
                                                            placeholder="0"
                                                            styles={{
                                                                input: {
                                                                    borderColor: estaExcedido ? '#fa5252' : undefined,
                                                                    backgroundColor: estaExcedido ? '#ffe0e0' : undefined,
                                                                    fontSize: '12px',
                                                                    padding: '6px'
                                                                }
                                                            }}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Resumen de pagos */}
                            <Paper bg={totalPagos > maxMontoTotal ? "red.0" : "green.0"} p="xs" radius="md">
                                <Group justify="space-between">
                                    <Text size="sm" fw={600}>
                                        Total a Pagar:
                                    </Text>
                                    <Text size="sm" fw={700} c={totalPagos > maxMontoTotal ? "red.7" : "green.7"}>
                                        {formatPeso(totalPagos)}
                                        {totalPagos > maxMontoTotal && ` (Excede ${formatPeso(totalPagos - maxMontoTotal)})`}
                                    </Text>
                                </Group>
                            </Paper>

                            {/* Método de pago - solo si hay monto > 0 */}
                            {totalPagos > 0 && (
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

                            {/* Devolución de envases - global para todos los tickets (FIFO en backend) */}
                            {maxEnvasesGlobal.bidones_20L > 0 && (
                                <CounterInput
                                    label="Devolver Bidones 20L"
                                    description={`Pendientes de devolver (de todos los tickets): ${maxEnvasesGlobal.bidones_20L}`}
                                    value={envases.bidones_20L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_20L: val }))}
                                    min={0}
                                    max={maxEnvasesGlobal.bidones_20L}
                                />
                            )}

                            {maxEnvasesGlobal.bidones_12L > 0 && (
                                <CounterInput
                                    label="Devolver Bidones 12L"
                                    description={`Pendientes de devolver (de todos los tickets): ${maxEnvasesGlobal.bidones_12L}`}
                                    value={envases.bidones_12L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_12L: val }))}
                                    min={0}
                                    max={maxEnvasesGlobal.bidones_12L}
                                />
                            )}

                            {maxEnvasesGlobal.sodas > 0 && (
                                <CounterInput
                                    label="Devolver Sodas"
                                    description={`Pendientes de devolver (de todos los tickets): ${maxEnvasesGlobal.sodas}`}
                                    value={envases.sodas}
                                    onChange={(val) => setEnvases(p => ({ ...p, sodas: val }))}
                                    min={0}
                                    max={maxEnvasesGlobal.sodas}
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
                        disabled={selectedTickets.length === 0 || totalPagos > maxMontoTotal}
                    >
                        Confirmar Liquidación
                    </Button>
                </Group>
            </Stack>
        </Modal>
    );
};

export default ModalLiquidacion;
