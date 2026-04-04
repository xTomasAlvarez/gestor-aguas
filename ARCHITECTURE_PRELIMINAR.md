# 📐 Arquitectura Preliminar: Multi-Ticket Payment

**Rama:** `feature/multi-ticket-payment`  
**Fecha:** 2026-04-04  
**Estado:** Pendiente SDD artifacts

---

## 🏗️ Flujo General (ANTES → DESPUÉS)

### ANTES (Single-Ticket)
```
User selecciona cliente
    ↓
FormCobranza carga tickets pendientes
    ↓
ModalLiquidacion muestra tickets
    ↓
User toca UNO (selectedTickets = [id])
    ↓
UI muestra: monto_pendiente, envases_pendientes de ESE ticket
    ↓
User ingresa: monto_abonado, envases_devueltos, método_pago
    ↓
Backend: registrarCobranza({ clienteId, ticketId, ... })
    ├─ Busca 1 ticket
    ├─ Valida monto vs deuda del ticket
    ├─ Crea 1 Cobranza
    └─ Actualiza Cliente.deuda
```

### DESPUÉS (Multi-Ticket)
```
User selecciona cliente
    ↓
FormCobranza carga tickets pendientes
    ↓
ModalLiquidacion muestra tickets
    ↓
User toca 1, 2, 3... tickets (selectedTickets = [id1, id2, id3])
    ↓
UI muestra TABLA:
  │ Ticket │ Fecha │ Deuda │ Monto a Pagar │
  ├─────────┼───────┼───────┼───────────────┤
  │ #789    │ 15/03 │ $100  │ [input]       │
  │ #790    │ 17/03 │ $100  │ [input]       │
  │ #791    │ 19/03 │ $100  │ [input]       │
    ↓
User ingresa MANUALMENTE cuánto paga en cada ticket
    ↓
UI suma y muestra: "Total a pagar: $XXX"
    ↓
User ingresa: envases_devueltos (GLOBAL), método_pago
    ↓
Backend: registrarCobranza({ clienteId, ticketIds, pagos, ... })
    ├─ Transacción ACID:
    │  ├─ FOR EACH ticketId:
    │  │  ├─ Busca ticket
    │  │  ├─ Valida monto vs deuda del ESTE ticket
    │  │  ├─ Actualiza monto_pagado
    │  │  └─ Crea 1 Cobranza
    │  ├─ Procesa envases FIFO (resto de más antiguos primero)
    │  └─ Actualiza Cliente.deuda UNA SOLA VEZ
    └─ Si error en cualquier punto: ROLLBACK TODO
```

---

## 📝 Cambios de Código (Resumen)

### Backend: `ventasService.registrarCobranza()`

**ANTES:**
```javascript
export const registrarCobranza = async (body, businessId) => {
    const { clienteId, ticketId, montoAbonado, envasesDevueltos, metodoPago } = body;
    
    // Procesa UN ticket
    const venta = await Venta.findOne({ _id: ticketId, ... });
    // ... validaciones ...
    venta.monto_pagado += montoAbonado;
    await venta.save({ session });
    
    await Cobranza.create([{ venta: venta._id, ... }], { session });
    await Cliente.findByIdAndUpdate(clienteId, { $inc: incCliente }, { session });
}
```

**DESPUÉS:**
```javascript
export const registrarCobranza = async (body, businessId) => {
    const { clienteId, ticketIds, pagos, envasesDevueltos, metodoPago } = body;
    //                                  ↑ NUEVO: array de { ticketId, monto }
    
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        // Valida todos los tickets existen
        const ventas = await Venta.find({
            _id: { $in: ticketIds },
            businessId,
            cliente: clienteId,
            estado: { $ne: "saldado" }
        }).session(session);
        
        if (ventas.length !== ticketIds.length) throw new Error("...");
        
        // Procesa CADA ticket
        const cobranzasParaCrear = [];
        const pagosPorTicket = new Map(pagos.map(p => [p.ticketId, p.monto]));
        
        for (const venta of ventas) {
            const montoPagadoEste = pagosPorTicket.get(String(venta._id)) || 0;
            venta.monto_pagado += montoPagadoEste;
            
            // Determina estado
            if (venta.monto_pagado === venta.total && envases_OK) {
                venta.estado = "saldado";
            } else {
                venta.estado = "pago_parcial";
            }
            
            await venta.save({ session });
            
            cobranzasParaCrear.push({
                venta: venta._id,
                cliente: clienteId,
                monto: montoPagadoEste,
                metodoPago,
                businessId
            });
        }
        
        // Crea MÚLTIPLES Cobranzas
        await Cobranza.insertMany(cobranzasParaCrear, { session });
        
        // Actualiza Cliente UNA SOLA VEZ
        const totalAbonadoGlobal = pagos.reduce((sum, p) => sum + p.monto, 0);
        const incCliente = {
            "deuda.saldo": -Math.abs(totalAbonadoGlobal),
            // ... envases ...
        };
        await Cliente.findByIdAndUpdate(clienteId, { $inc: incCliente }, { session });
        
        await session.commitTransaction();
        return { message: "Liquidación múltiple...", ventas };
        
    } catch (error) {
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
}
```

### Frontend: `ModalLiquidacion.jsx`

**ANTES:**
```javascript
const handleTicketToggle = (ticketId) => {
    setSelectedTickets(prev => {
        // Por ahora solo permitimos UN ticket a la vez
        if (prev.includes(ticketId)) {
            return prev.filter(id => id !== ticketId);
        } else {
            return [ticketId];  // ← FUERZA UN SOLO
        }
    });
};

const ticketActual = tickets.find(t => t._id === selectedTickets[0]);
const maxMonto = ticketActual?.total - ticketActual?.monto_pagado;
```

**DESPUÉS:**
```javascript
const handleTicketToggle = (ticketId) => {
    setSelectedTickets(prev => {
        if (prev.includes(ticketId)) {
            return prev.filter(id => id !== ticketId);
        } else {
            return [...prev, ticketId];  // ← PERMITE MÚLTIPLES
        }
    });
};

const ticketsSeleccionados = tickets.filter(t => 
    selectedTickets.includes(String(t._id))
);

const maxMonto = ticketsSeleccionados.reduce((sum, t) => 
    sum + Math.max(0, t.total - t.monto_pagado), 0
);

// NUEVA: Tabla de distribución manual
const [pagosTabla, setPagosTabla] = useState([]);  // [{ ticketId, monto }, ...]

const handleConfirmar = async () => {
    const payload = {
        clienteId,
        ticketIds: selectedTickets,
        pagos: pagosTabla,  // ← NUEVO: distribución manual
        envasesDevueltos: envases,
        metodoPago
    };
    
    const response = await registrarCobranza(payload);
    // ...
};
```

---

## 🗂️ Estructura de Archivos

```
feature/multi-ticket-payment
├── FEATURE_MULTI_TICKET_PAYMENT.md (tracking)
├── BackEnd/
│   ├── src/
│   │   ├── services/
│   │   │   └── ventasService.js (refactor registrarCobranza)
│   │   └── __tests__/
│   │       └── ventasService.multi-ticket.test.js (NUEVO)
│   └── package.json (sin cambios)
├── FrontEnd/
│   ├── src/
│   │   ├── features/sales/
│   │   │   └── components/ventas/
│   │   │       ├── ModalLiquidacion.jsx (refactor)
│   │   │       └── __tests__/
│   │   │           └── ModalLiquidacion.multi-ticket.test.js (NUEVO)
│   └── package.json (sin cambios)
└── README_TECNICO.md (actualizar sección Cobranza)
```

---

## 🔍 Cambios de API Contract

### Request (Backend)

**ANTES:**
```javascript
{
  "clienteId": "cliente123",
  "ticketId": "venta789",         // ← UN SOLO
  "montoAbonado": 50,
  "envasesDevueltos": { bidones_20L: 2, ... },
  "metodoPago": "efectivo"
}
```

**DESPUÉS:**
```javascript
{
  "clienteId": "cliente123",
  "ticketIds": ["venta789", "venta790", "venta791"],  // ← MÚLTIPLES
  "pagos": [                      // ← NUEVO: distribución manual
    { "ticketId": "venta789", "monto": 30 },
    { "ticketId": "venta790", "monto": 50 },
    { "ticketId": "venta791", "monto": 20 }
  ],
  "envasesDevueltos": { bidones_20L: 5, ... },        // ← GLOBAL (FIFO)
  "metodoPago": "efectivo"
}
```

### Response

**ANTES:**
```javascript
{
  "message": "Cobranza registrada exitosamente.",
  "venta": { _id, monto_pagado, estado, ... }
}
```

**DESPUÉS:**
```javascript
{
  "message": "Liquidación múltiple registrada exitosamente.",
  "ventas": [
    { _id: "venta789", monto_pagado: 30, estado: "pago_parcial", ... },
    { _id: "venta790", monto_pagado: 50, estado: "pago_parcial", ... },
    { _id: "venta791", monto_pagado: 20, estado: "pago_parcial", ... }
  ]
}
```

---

## 🎯 Puntos Críticos de Validación

| Validación | Quién | Qué | Dónde |
|-----------|-------|-----|-------|
| N tickets seleccionados | Frontend | > 0 y ≤ 10 | ModalLiquidacion |
| Monto por ticket | Frontend | ≥ 0, ≤ deuda_ticket | handleConfirmar |
| Suma de montos | Frontend | Muestra total | UI tabla |
| Tickets existen | Backend | Query N tickets | registrarCobranza |
| Cliente owns tickets | Backend | Validar cliente_id | registrarCobranza |
| Deuda global | Backend | Suma vs deuda_total | registrarCobranza |
| Envases FIFO | Backend | Resta de más antiguos | registrarCobranza |
| Transacción ACID | Backend | Rollback si error | MongoDB session |

---

## 🧪 Testing Strategy

### Jest Backend Tests
```javascript
describe('registrarCobranza - Multi-Ticket', () => {
  test('Pago de 1 ticket (backward compat)', ...);
  test('Pago de 2 tickets exitoso', ...);
  test('Pago de 5 tickets con distribución manual', ...);
  test('Fallo mid-transaction hace rollback', ...);
  test('Validación: exceder deuda total rechazada', ...);
  test('FIFO de envases funciona correctamente', ...);
});
```

### Jest Frontend Tests
```javascript
describe('ModalLiquidacion - Multi-Ticket', () => {
  test('Permite seleccionar múltiples checkboxes', ...);
  test('Calcula maxMonto como suma de deudas', ...);
  test('Tabla de distribución muestra tickets', ...);
  test('Validaciones previenen submit inválido', ...);
  test('Suma de pagos no excede deuda total', ...);
});
```

### Playwright E2E Tests
```javascript
describe('Multi-Ticket Payment E2E', () => {
  test('Flujo completo: 3 tickets, pago múltiple', ...);
  test('Error handling: fallo en servidor', ...);
  test('Envases: devolver de múltiples tickets', ...);
});
```

---

## ⚠️ Riesgos Identificados

| Riesgo | Severidad | Mitigación |
|--------|-----------|-----------|
| Loop infinito si error | 🔴 Crítico | Tests exhaustivos, try-catch |
| Deuda mal actualizada | 🔴 Crítico | Transacción ACID MongoDB |
| Envases duplicados | 🟠 Alto | Validar suma FIFO |
| UX confusa | 🟡 Medio | Tests con usuario real |
| Performance > 10 tickets | 🟡 Medio | Limitar en validación |

---

## 📅 Timeline Estimado

- **Día 1 (Backend):** 4-5 horas
  - Refactor registrarCobranza
  - Tests Jest
  
- **Día 2 (Frontend):** 4-5 horas
  - Refactor ModalLiquidacion
  - Tabla de distribución
  - Tests Jest

- **Día 3 (E2E + Polish):** 3-4 horas
  - Playwright E2E
  - Code review (AGENTS.md)
  - Documentación

---

**Siguiente:** Esperar SDD artifacts (proposal, spec, design, tasks)
