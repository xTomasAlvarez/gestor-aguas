import { useState, useEffect, useMemo } from "react";
import { Select, NativeSelect, Button, Paper, Group, Stack, NumberInput } from "@mantine/core";
import CounterInput from "../CounterInput";
import { obtenerVentas, registrarCobranza } from "../../services/ventasService";
import { formatPeso, formatFecha } from "../../utils/format";
import toast from "react-hot-toast";

const FormCobranza = ({ clienteId, onExito, onCancelar }) => {
    const [tickets, setTickets] = useState([]);
    const [cargando, setCargando] = useState(false);
    
    const [ticketId, setTicketId] = useState(null);
    const [montoAbonado, setMontoAbonado] = useState("");
    const [metodoPago, setMetodoPago] = useState("efectivo");
    const [envases, setEnvases] = useState({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    const [enviando, setEnviando] = useState(false);

    useEffect(() => {
        if (!clienteId) {
            setTickets([]);
            setTicketId(null);
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
                setTicketId(null);
                setMontoAbonado("");
                setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
            } catch (err) {
                console.error(err);
                toast.error("Error al cargar los tickets adeudados.");
            } finally {
                setCargando(false);
            }
        };
        cargarTickets();
    }, [clienteId]);

    const ticketSelectOptions = useMemo(() => {
        if (!Array.isArray(tickets)) return [];
        return tickets.filter(t => t != null && t._id).map(t => {
            const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            const itemsArr = Array.isArray(t?.items) ? t.items : [];
            itemsArr.forEach(item => {
                if (String(item?.producto) === "Bidon 20L") prestados.bidones_20L += Number(item?.cantidad || 0);
                if (String(item?.producto) === "Bidon 12L") prestados.bidones_12L += Number(item?.cantidad || 0);
                if (String(item?.producto) === "Soda")      prestados.sodas       += Number(item?.cantidad || 0);
            });
            const saldoMonetario = Math.max(0, Number(t?.total || 0) - Number(t?.monto_pagado || 0));
            const strItems = itemsArr.length > 0 
                ? itemsArr.map(i => `${Number(i?.cantidad || 0)}x ${String(i?.producto || "")}`).join(", ") 
                : "Cobranza";
            
            return {
                value: String(t._id),
                label: String(`${formatFecha(t?.fecha)} - Deuda: ${formatPeso(saldoMonetario)} - Items: ${strItems}`)
            };
        });
    }, [tickets]);

    const ticketActual = useMemo(() => tickets.find(t => String(t?._id) === String(ticketId)), [tickets, ticketId]);

    // Limites del ticket seleccionado
    const maxMonto = ticketActual ? Math.max(0, (ticketActual?.total || 0) - (ticketActual?.monto_pagado || 0)) : 0;
    
    const maxEnvases = useMemo(() => {
        const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        if (!ticketActual) return prestados;
        ticketActual?.items?.forEach(item => {
            if (item?.producto === "Bidon 20L") prestados.bidones_20L += (item?.cantidad || 0);
            if (item?.producto === "Bidon 12L") prestados.bidones_12L += (item?.cantidad || 0);
            if (item?.producto === "Soda")      prestados.sodas       += (item?.cantidad || 0);
        });
        const devueltos = ticketActual?.envases_devueltos || { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        return {
            bidones_20L: Math.max(0, prestados.bidones_20L - (devueltos.bidones_20L || 0)),
            bidones_12L: Math.max(0, prestados.bidones_12L - (devueltos.bidones_12L || 0)),
            sodas:       Math.max(0, prestados.sodas - (devueltos.sodas || 0))
        };
    }, [ticketActual]);

    // Resetear form si se cambia de ticket
    useEffect(() => {
        setMontoAbonado("");
        setEnvases({ bidones_20L: 0, bidones_12L: 0, sodas: 0 });
    }, [ticketId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ticketId) return toast.error("Por favor selecciona un ticket para saldar.");
        
        const abonoNumeric = Number(montoAbonado) || 0;
        if (abonoNumeric === 0 && envases.bidones_20L === 0 && envases.bidones_12L === 0 && envases.sodas === 0) {
            return toast.error("Debes ingresar un monto o devolver al menos un envase.");
        }

        const payload = {
            clienteId,
            ticketId,
            montoAbonado: abonoNumeric,
            envasesDevueltos: envases,
            metodoPago
        };

        console.log("1. Iniciando petición al backend...", payload);
        setEnviando(true);

        try {
            const response = await registrarCobranza(payload);
            console.log("2. Respuesta recibida:", response);
            toast.success("Liquidación registrada correctamente.");
            
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

    if (!clienteId) {
        return <p className="text-sm text-slate-400 text-center py-4">Selecciona un cliente arriba para ver sus deudas.</p>;
    }

    return (
        <div className="form-cobranza">
            <Stack gap="md">
                <Select
                    label="Seleccionar Ticket Adeudado"
                    placeholder={cargando ? "Cargando tickets..." : "Elige un ticket..."}
                    data={ticketSelectOptions}
                    value={ticketId}
                    onChange={setTicketId}
                    disabled={cargando || ticketSelectOptions.length === 0}
                    searchable
                    clearable
                    nothingFoundMessage="No hay tickets impagos"
                    comboboxProps={{ portalProps: { target: 'body' }, withinPortal: true }}
                    // Prevent virtualized rendering glitch over touch layers in forms inside modals
                    maxDropdownHeight={250}
                />

                {(!cargando && ticketSelectOptions.length === 0) ? (
                    <Paper bg="teal.0" c="teal.7" p="sm" radius="md">
                        <p className="text-sm font-medium text-center">Este cliente no tiene tickets pendientes.</p>
                    </Paper>
                ) : null}

                {ticketActual ? (
                    <Paper withBorder radius="md" p="md" bg="slate.50">
                        <Stack gap="sm">
                            <p className="text-sm font-bold text-slate-800">Liquidación Parcial / Total</p>
                            
                            <NumberInput
                                label="Monto a Pagar ($)"
                                description={`Deuda restante monetaria: ${formatPeso(maxMonto)}`}
                                descriptionProps={{ c: 'dimmed' }}
                                placeholder="0"
                                value={montoAbonado}
                                onChange={setMontoAbonado}
                                min={0}
                                max={maxMonto}
                                hideControls
                                size="md"
                                // Prevenir auto zoom de iOS y saltos bruscos
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

                            {(maxEnvases.bidones_20L > 0) ? (
                                <CounterInput
                                    label="Devolver Bidones 20L"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.bidones_20L}`}
                                    value={envases.bidones_20L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_20L: val }))}
                                    min={0}
                                    max={maxEnvases.bidones_20L}
                                />
                            ) : null}
                            
                            {(maxEnvases.bidones_12L > 0) ? (
                                <CounterInput
                                    label="Devolver Bidones 12L"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.bidones_12L}`}
                                    value={envases.bidones_12L}
                                    onChange={(val) => setEnvases(p => ({ ...p, bidones_12L: val }))}
                                    min={0}
                                    max={maxEnvases.bidones_12L}
                                />
                            ) : null}

                            {(maxEnvases.sodas > 0) ? (
                                <CounterInput
                                    label="Devolver Sodas"
                                    description={`Pendientes de devolver en este ticket: ${maxEnvases.sodas}`}
                                    value={envases.sodas}
                                    onChange={(val) => setEnvases(p => ({ ...p, sodas: val }))}
                                    min={0}
                                    max={maxEnvases.sodas}
                                />
                            ) : null}
                        </Stack>
                    </Paper>
                ) : null}

                <Group justify="flex-end" mt="xl">
                    {onCancelar ? <Button variant="subtle" color="gray" onClick={onCancelar}>Cancelar</Button> : null}
                    <Button 
                        type="button" 
                        onClick={handleSubmit}
                        color="indigo"
                        variant="filled"
                        loading={enviando}
                        disabled={!ticketId || ticketSelectOptions.length === 0}
                    >
                        Confirmar Liquidación
                    </Button>
                </Group>
            </Stack>
        </div>
    );
};

export default FormCobranza;
