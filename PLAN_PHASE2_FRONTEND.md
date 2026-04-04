# Plan: Phase 2 Frontend - Multi-Ticket Payment (ModalLiquidacion)

## Objetivo
Refactorizar `ModalLiquidacion.jsx` para permitir seleccionar **múltiples tickets** en una sola transacción, mostrando una **tabla de distribución manual de montos** donde el repartidor decide cuánto paga en cada ticket.

---

## Supuestos

| Decisión | Supuesto | Alternativa Rechazada |
|----------|----------|----------------------|
| **Múltiples selecciones** | Permitir N checkboxes seleccionados simultáneamente | Mantener toggle de un-solo (ya implementado, backward compat en backend) |
| **Tabla de distribución** | Mostrar una tabla inline dentro del modal con inputs para cada monto | Modal emergente separate (más clicks) |
| **Envases globales** | Cuando se seleccionan múltiples, hay UN campo "Devolver Envases" que se aplica a FIFO | Envases por ticket (más complejo, menos intuición) |
| **Método de pago único** | Todos los tickets de la batch se pagan con el MISMO método | Permitir método diferente por ticket (no required, complejidad extra) |
| **Máximo de tickets** | Limitar a máx 10 tickets por transacción | Sin límite (pero backend ya lo valida) |
| **Validación en frontend** | Validar suma de pagos ≤ deuda total ANTES de enviar | Solo dejar que backend rechace (mala UX) |
| **Edición de tabla** | Inputs inline editable, sin guardado fino hasta "Confirmar" | Guardado auto por cada cambio (innecesario) |

---

## Componentes Principales

### 1. ModalLiquidacion (refactor principal)
**Cambios:**
- `handleTicketToggle()` — Permitir múltiples en lugar de toggle uno-solo
- `maxMonto` → `maxMontoTotal` — suma de deuda de TODOS los tickets seleccionados
- `maxEnvases` → cambio: se aplica a la batch global, no por ticket
- **NUEVO:** `pagosTabla` estado — array de `{ ticketId, monto }`
- **NUEVO:** `<TablaDistribucion />` subcomponente para mostrar/editar pagos
- Envases: UN único campo global (no separado por ticket)

### 2. TablaDistribucion (NUEVO subcomponente)
**Props:**
- `ticketsSeleccionados`: array de tickets con { _id, fecha, total, monto_pagado, items }
- `pagosTabla`: array de { ticketId, monto }
- `onPagosChange`: callback para actualizar pagosTabla
- `onMaxMontoExcedido`: callback si suma > deuda_total

**Responsabilidad:**
- Renderizar tabla con columnas: Fecha | Items | Deuda Restante | Monto a Pagar [input]
- Validar en tiempo real: monto_por_ticket ≤ deuda_de_ese_ticket
- Mostrar suma total de pagos
- Highlighting si suma excede deuda total (rojo)

**Lógica:**
```
- Al montar: calcular pagosTabla inicial = { ticketId, monto: 0 } para cada ticket
- Input change: updatePagosTabla({ ticketId, monto: nuevo_valor })
- Validación: SI suma > deudaTotal → visualmente disable Confirmar
```

---

## Contratos / Tipos

### Estado del Componente
```typescript
// Nuevo estado para soportar multi-ticket
const [pagosTabla, setPagosTabla] = useState<Array<{ ticketId: string; monto: number }>>();

// Tipo del ticket (basado en lo que llega del backend)
interface Ticket {
  _id: string;
  fecha: Date | string;
  total: number;
  monto_pagado: number;
  estado: 'pendiente' | 'pago_parcial' | 'saldado';
  items: Array<{
    producto: 'Bidon 20L' | 'Bidon 12L' | 'Soda';
    cantidad: number;
  }>;
  envases_devueltos?: {
    bidones_20L: number;
    bidones_12L: number;
    sodas: number;
  };
}

// Props de TablaDistribucion
interface TablaDistribucionProps {
  ticketsSeleccionados: Ticket[];
  pagosTabla: Array<{ ticketId: string; monto: number }>;
  onPagosChange: (pagos: Array<{ ticketId: string; monto: number }>) => void;
  maxMontoTotal: number;
  montoTotalIngresado: number;
}

// Payload al backend (NUEVA API - compatibilidad hacia atrás)
interface PayloadMultiTicket {
  clienteId: string;
  ticketIds: string[];        // Nuevo
  pagos: Array<{ ticketId: string; monto: number }>;  // Nuevo
  envasesDevueltos: {
    bidones_20L: number;
    bidones_12L: number;
    sodas: number;
  };
  metodoPago: 'efectivo' | 'transferencia';
}

// Response del backend (NUEVA API)
interface RegistroCobranzaResponse {
  message: string;
  ventas: Array<{
    _id: string;
    monto_pagado: number;
    estado: 'pendiente' | 'pago_parcial' | 'saldado';
  }>;
}
```

---

## Edge Cases

| Caso | Problema | Solución |
|------|----------|----------|
| Usuario selecciona 2 tickets, total deuda $100, intenta pagar $150 | Suma excede deuda total | Mostrar error rojo en tabla, disable botón Confirmar |
| Usuario selecciona ticket, pero NO ingresa nada en tabla | Suma de pagos = $0 | Permitir si hay envases, sino error "ingresa monto o envases" |
| Usuario desselecciona un ticket tras haber ingresado monto | Ese ticket desaparece de tabla | Limpiar el pago de ese ticket automáticamente |
| Usuario abre modal, selecciona 5 tickets, luego cierra y reabre | Estado anterior persiste | Resetear todo (selectedTickets, pagosTabla, envases, metodoPago) en `useEffect` cuando `opened` cambia |
| Envases: usuario selecciona 3 tickets pero solo ingresa 2 envases | FIFO debe procesar esos 2 envases al ticket más antiguo | Backend ya lo maneja, frontend solo envía el número total |
| Input en tabla: usuario ingresa "abc" en monto | NumberInput debe rechazar texto | Usar `type="number"` o validación inline |
| Usuario ingresa monto MAYOR que deuda del ticket individual | Validación por ticket | SI monto_por_ticket > deuda_de_ese_ticket → error tooltip rojo |
| Máximo 10 tickets | Si selecciona > 10 | Disable checkbox si ya hay 10 seleccionados |

---

## Orden de Implementación

### 1. Refactor de Estado (30 min)
- [ ] Cambiar `handleTicketToggle()` para permitir múltiples (NO toggle uno-solo)
- [ ] Agregar estado `pagosTabla: []`
- [ ] Calcular `maxMontoTotal` = suma deuda de todos los tickets seleccionados
- [ ] Actualizar cleanup de estado en `useEffect`

### 2. Crear TablaDistribucion Subcomponente (60 min)
- [ ] Interface de props
- [ ] Layout: tabla responsiva (columnas: Fecha, Items, Deuda Restante, Monto a Pagar)
- [ ] Inicializar `pagosTabla` cuando tickets seleccionados cambian
- [ ] NumberInput inline editable por cada ticket
- [ ] Validaciones por ticket (monto ≤ deuda individual)

### 3. Integrar Tabla en Modal (45 min)
- [ ] Reemplazar sección "Configuración de pago - solo si hay un ticket seleccionado"
- [ ] Mostrar TablaDistribucion cuando `selectedTickets.length > 0`
- [ ] Mostrar suma total de pagos debajo de tabla
- [ ] Highlighting rojo si suma > deuda total

### 4. Refactor Envases (30 min)
- [ ] Cambiar: no más "maxEnvases" por ticket, sino UN campo global para TODOS
- [ ] Mostrar "Devolver Envases (se aplican a FIFO)"
- [ ] Calcular máximo: suma total de envases pendientes de todos los tickets seleccionados

### 5. Refactor handleConfirmar() (30 min)
- [ ] Construir payload NUEVA API: `{ clienteId, ticketIds, pagos, envasesDevueltos, metodoPago }`
- [ ] Fallback a API LEGACY si `selectedTickets.length === 1` (backward compat)
- [ ] Validar suma pagos ≤ deuda total
- [ ] Enviar POST

### 6. Tests Jest (90 min)
- [ ] Test: permite seleccionar múltiples checkboxes
- [ ] Test: tabla muestra todos los tickets seleccionados
- [ ] Test: calcular maxMontoTotal correctamente
- [ ] Test: validación suma de pagos no excede deuda total
- [ ] Test: desseleccionar ticket limpia su pago de tabla
- [ ] Test: reseteo al abrir/cerrar modal
- [ ] Test: payload correcto al backend (ticketIds array, pagos array)

### 7. E2E Playwright (120 min)
- [ ] Flujo: 3 tickets, seleccionar todos, distribuir montos, confirmar
- [ ] Flujo: 2 tickets, intenta pagar más que deuda → error
- [ ] Flujo: devolver envases con múltiples tickets
- [ ] Flujo: desseleccionar en medio de pago

---

## Decisiones de Diseño

### 1. ¿Por qué una tabla inline y no modal emergente?
**Elegida:** Tabla inline dentro de ModalLiquidacion  
**Razón:** Menos complejidad (un solo modal), la tabla es el core de la feature, menos clicks para el usuario  
**Alternativa rechazada:** Modal emergente (requiere estado extra, confunde flujo)

### 2. ¿Envases por ticket o globales?
**Elegida:** Globales (UN campo que se aplica FIFO)  
**Razón:** El usuario ve que devuelve "5 bidones", no piensa en qué ticket corresponde cada uno. Backend maneja FIFO  
**Alternativa rechazada:** Por ticket (requiere tracking extra en frontend, innecesario)

### 3. ¿Método de pago por ticket o global?
**Elegida:** Global (UN método para toda la batch)  
**Razón:** Repartidor cobra en un momento, no cambia método entre tickets de la misma sesión  
**Alternativa rechazada:** Por ticket (complejidad, raras veces necesario)

### 4. ¿Validación en frontend o dejar que backend rechace?
**Elegida:** Validación proactiva en frontend  
**Razón:** UX mejor (feedback inmediato), reduce latencia de red  
**Alternativa rechazada:** Solo backend (frustra usuario, requiere reintentos)

### 5. ¿Estado de tabla en useState local o Zustand?
**Elegida:** useState local  
**Razón:** El modal es un widget self-contained, no necesita persistencia entre sesiones ni acceso desde otros componentes  
**Alternativa rechazada:** Zustand (overkill para estado efímero)

### 6. ¿Máximo de tickets a seleccionar?
**Elegida:** Máx 10 (validación frontend)  
**Razón:** Performance (tabla no se vuelve un scrolleador), backend también lo valida  
**Alternativa rechazada:** Sin límite (tabla muy larga, UI degradada)

---

## Checklist de Validación (antes de confirmar)

- [ ] Todos los checkboxes: múltiple selección (sin toggle uno-solo)
- [ ] Tabla con columnas correctas: Fecha | Items | Deuda Restante | Monto a Pagar
- [ ] Inputs de monto: validación en tiempo real por ticket (≤ deuda individual)
- [ ] Suma total de pagos visible debajo de tabla
- [ ] Suma total > deuda total → rojo + disable botón Confirmar
- [ ] Envases: UN campo global (máx = suma pendientes de todos)
- [ ] Método de pago único (aparece si hay ALGÚN monto > 0)
- [ ] Payload a backend: `{ ticketIds, pagos, envasesDevueltos, ... }` (nueva API)
- [ ] Backward compat: si 1 solo ticket seleccionado, puede funcionar con API legacy
- [ ] Reseteo al abrir/cerrar: todos los inputs quedan en blanco
- [ ] Tests Jest: 6+ casos cubiertos
- [ ] E2E: 4+ flujos probados

---

## Timeline Estimado

- **Refactor estado + TablaDistribucion:** 90 min
- **Integración en Modal:** 45 min
- **Refactor Envases + handleConfirmar:** 60 min
- **Jest Tests:** 90 min
- **E2E Tests:** 120 min
- **Code review + ajustes:** 30 min

**Total estimado:** 6-7 horas

---

## ¿Procedemos con este plan?

**Confirmación necesaria antes de implementar:**

¿Está alineado el plan con tus expectativas?  
¿Hay algo que ajustar en:
- [ ] Estructura de la tabla?
- [ ] Tipo de validaciones?
- [ ] Límite de 10 tickets?
- [ ] Otra cosa?

Una vez confirmado → delegaré la implementación a un sub-agente.
