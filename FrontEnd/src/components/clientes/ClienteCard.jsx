import React from "react";
import { Archive } from "lucide-react";
import { Card, Text, Badge, Button, Group, Divider, Grid } from "@mantine/core";

// ── Tarjeta de cliente activo ─────────────────────────────────────────────
const ClienteCard = React.memo(({ cliente, onEditar, onDesactivar, onVerHistorico }) => {
    const { nombre, direccion, localidad, telefono, deuda, saldo_pendiente = 0, dispensersAsignados = 0 } = cliente;
    const { bidones_20L = 0, bidones_12L = 0, sodas = 0 } = deuda || {};
    const tieneDeuda = bidones_20L > 0 || bidones_12L > 0 || sodas > 0 || saldo_pendiente > 0;
    const telDisplay = telefono ? `+${telefono.slice(0,2)} ${telefono.slice(2,5)} ${telefono.slice(5,8)}-${telefono.slice(8)}` : null;

    return (
        <Card 
            shadow="sm" 
            padding="lg" 
            radius="xl" 
            withBorder
            className="flex flex-col group transition-all duration-300 hover:-translate-y-1 hover:shadow-md bg-white border-slate-100"
        >
            <Card.Section withBorder inheritPadding py="xs" mb="md">
                <Group justify="space-between" align="flex-start" wrap="nowrap">
                    <div className="flex-1 min-w-0">
                        <Group gap="xs" wrap="nowrap" align="center">
                            <Text fw={900} size="xl" className="font-display truncate text-slate-900" style={{ lineHeight: 1.1 }}>
                                {nombre}
                            </Text>
                            {dispensersAsignados > 0 && (
                                <Badge color="indigo" variant="light" size="sm" radius="sm" fw={900} style={{ letterSpacing: '0.05em' }}>
                                    Eq: {dispensersAsignados}
                                </Badge>
                            )}
                        </Group>
                        {(direccion || localidad) && (
                            <Text size="sm" fw={500} c="dimmed" mt={4} truncate>
                                {direccion}{direccion && localidad ? " - " : ""}{localidad}
                            </Text>
                        )}
                        {telDisplay && (
                            <Text component="a" href={`tel:+${telefono}`} size="sm" fw={600} c="indigo.6" className="hover:text-indigo-700 transition-colors mt-2 block tracking-wide">
                                {telDisplay}
                            </Text>
                        )}
                    </div>
                    <Badge color={tieneDeuda ? "red" : "teal"} variant={tieneDeuda ? "filled" : "light"} className="shadow-sm">
                        {tieneDeuda ? "Con deuda" : "Al dia"}
                    </Badge>
                </Group>
            </Card.Section>
            
            <div className="flex-1">
                <Text size="xs" fw={700} tt="uppercase" c="dimmed" mb="sm" style={{ letterSpacing: '0.05em' }}>Envases adeudados</Text>
                
                <Grid gutter="sm">
                    {[{ label:"Bidón 20L", val:bidones_20L },{ label:"Bidón 12L", val:bidones_12L },{ label:"Sodas", val:sodas }].map(({label,val})=>(
                        <Grid.Col span={4} key={label}>
                            <div className={`rounded-xl p-3 text-center transition-colors ${val>0?"bg-red-50 border border-red-200":"bg-slate-50 border border-slate-100"}`}>
                                <Text size="xl" fw={val>0 ? 900 : 700} c={val>0 ? 'red.6' : 'dark.6'} className="font-display leading-none">
                                    {val}
                                </Text>
                                <Text size="10px" fw={700} c="dimmed" mt={6} tt="uppercase" style={{ letterSpacing: '0.05em' }}>{label}</Text>
                            </div>
                        </Grid.Col>
                    ))}
                </Grid>
                
                {saldo_pendiente > 0 && (
                    <div className="mt-4 bg-red-50 rounded-xl px-4 py-3 flex items-center justify-between border border-red-200">
                        <div>
                            <Text size="10px" fw={700} c="red.7" tt="uppercase" style={{ letterSpacing: '0.05em' }} className="opacity-80 leading-none mb-1">Monto adeudado</Text>
                            <Text size="xl" fw={900} c="red.6" className="font-display tracking-tight">${saldo_pendiente.toLocaleString("es-AR")}</Text>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                            <svg viewBox="0 0 24 24" fill="none" strokeWidth={2.5} className="w-5 h-5 stroke-red-600">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8v1m0 10v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                            </svg>
                        </div>
                    </div>
                )}
            </div>
            
            <Card.Section withBorder inheritPadding py="sm" mt="md">
                <Group grow gap="xs">
                    <Button onClick={() => onEditar(cliente)} variant="light" color="indigo">Editar</Button>
                    <Button onClick={() => onVerHistorico(cliente)} variant="light" color="indigo">Fiados</Button>
                    <Button onClick={() => onDesactivar(cliente)} variant="subtle" color="red" leftSection={<Archive className="w-4 h-4" />}>
                        Baja
                    </Button>
                </Group>
            </Card.Section>
        </Card>
    );
});

export default ClienteCard;
