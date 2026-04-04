# 🎯 Feature: Multi-Ticket Payment (Pago de Múltiples Fiados)

**Rama:** `feature/multi-ticket-payment`  
**Creada:** 2026-04-04  
**Base:** `develop`  
**Estado:** 🔄 En Desarrollo

---

## 📋 Descripción

Permite al repartidor seleccionar y pagar **múltiples tickets de fiados en una sola transacción**, en lugar de uno a la vez. Esto agiliza el proceso de cobro cuando el cliente tiene varias deudas pendientes.

### User Story
> Como repartidor, quiero poder seleccionar y pagar múltiples tickets de fiado en una sola transacción para agilizar cobros cuando un cliente tiene varias deudas pendientes.

---

## 🎯 User Preferences (Confirmadas)

| Decisión | Opción | Detalles |
|----------|--------|----------|
| A) Distribution | #3 Manual | Repartidor controla cuánto paga en cada ticket |
| B) Containers | #1 Global | Sistema maneja FIFO (resta de más antiguos primero) |
| C) Payment Method | #B Flexible | MISMO método para toda la batch |
| D) UI Layout | #1 Detailed | Tabla con desglose completo de pagos por ticket |
| E) Error Handling | #1 ACID | Fail-fast (todo o nada) con transacción ACID |

---

## 📊 SDD Artifacts Status

- [ ] **Propuesta** (sdd-propose): `presidential-moccasin-thrush`
- [ ] **Especificación** (sdd-spec): `melodic-crimson-barracuda`
- [ ] **Diseño Técnico** (sdd-design): `relieved-lavender-pigeon`
- [ ] **Tareas** (sdd-tasks): `valuable-lavender-blackbird`

---

## 🔧 Implementation Checklist

### Backend Tasks
- [ ] Task 1: Refactorizar `ventasService.registrarCobranza()` para `ticketIds[]`
- [ ] Task 2: Loop sobre múltiples tickets dentro de transacción
- [ ] Task 3: Lógica de distribución manual de montos
- [ ] Task 4: FIFO de envases
- [ ] Task 5: Jest tests (1, 2, 5 tickets, rollback)

### Frontend Tasks
- [ ] Task 6: Refactorizar `ModalLiquidacion.jsx`
- [ ] Task 7: Cambiar `handleTicketToggle()` para múltiples
- [ ] Task 8: Refactorizar cálculos (`maxMonto`, `maxEnvases`)
- [ ] Task 9: Tabla de distribución manual
- [ ] Task 10: Validaciones multi-ticket
- [ ] Task 11: Jest tests

### E2E & Integration
- [ ] Task 12: E2E Playwright (3 tickets, pago múltiple)
- [ ] Task 13: E2E Error handling
- [ ] Task 14: E2E Envases
- [ ] Task 15-17: Integración y documentación
- [ ] Task 18-20: Code review y polish

---

## 📁 Archivos Modificados

### Backend
- `BackEnd/src/services/ventasService.js` - Refactor `registrarCobranza()`

### Frontend
- `FrontEnd/src/features/sales/components/ventas/ModalLiquidacion.jsx` - Principal

### Tests
- `BackEnd/src/services/__tests__/ventasService.multi-ticket.test.js` (nuevo)
- `FrontEnd/src/features/sales/components/ventas/__tests__/ModalLiquidacion.multi-ticket.test.js` (nuevo)

### Docs
- `README_TECNICO.md` - Actualizar sección de Cobranza

---

## 🚀 Implementación

### Fase 1: Backend (Día 1)
```bash
npm run test  # Asegurar tests pasen
```

### Fase 2: Frontend (Día 2)
```bash
npm run dev  # Verificar UI funcionando
```

### Fase 3: Testing (Día 3)
```bash
npm run test:watch
npm run test:e2e
```

---

## ✅ Aceptación

- [x] Cero migraciones de base de datos requeridas
- [ ] Todos los tests pasan (Jest + Playwright)
- [ ] Code review según `AGENTS.md`
- [ ] Feedback positivo del usuario (repartidor)
- [ ] Documentación actualizada

---

## 📌 Notas

- **No requiere migraciones:** Esquemas ya soportan multi-payment
- **Backward-compatible:** Cambios solo en lógica, no en estructura
- **Transacciones ACID:** MongoDB garantiza integridad
- **Performance:** Limitar a máx 10 tickets por transacción

---

**Última actualización:** 2026-04-04  
**Responsable:** JARVIS AI  
**Estado:** 🔄 Esperando SDD artifacts...
