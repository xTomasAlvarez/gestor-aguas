# Requirements Document

## Introduction

Esta funcionalidad mejora la visualización de información temporal en el módulo de Cobranzas Extra del sistema de planilla diaria. Actualmente, el sistema muestra cobranzas extra (pagos de deudas previas) sin indicar cuándo se originó la deuda, lo que dificulta el seguimiento y la claridad para el usuario. Esta mejora agrega la fecha de origen de la venta en las cobranzas extra y la fecha de pago en los tickets fiados que han sido parcialmente pagados.

## Glossary

- **Planilla_Diaria**: Reporte consolidado de ventas y cobranzas para una fecha específica
- **Cobranzas_Extra**: Pagos recibidos en el día actual correspondientes a ventas fiadas de fechas anteriores
- **Venta_Original**: La venta fiada que generó la deuda que se está cobrando
- **Ticket_Fiado**: Una venta registrada como "fiado" que genera una deuda pendiente
- **Backend_Service**: Servicio de backend ubicado en services/ventasService.js
- **Frontend_Component**: Componente React ubicado en PlanillaPage.jsx
- **Arqueo**: Proceso de revisión y cuadre de caja diaria

## Requirements

### Requirement 1: Incluir Fecha de Venta Original en Cobranzas Extra

**User Story:** Como usuario del sistema de arqueo, quiero ver la fecha en que se originó cada deuda en las cobranzas extra, para poder identificar rápidamente la antigüedad de las deudas cobradas.

#### Acceptance Criteria

1. WHEN el Backend_Service ejecuta la consulta de cobranzas del día, THE Backend_Service SHALL incluir populate de la venta original con el campo fecha
2. THE Backend_Service SHALL retornar en cada objeto de cobranzasExtra el campo venta.fecha poblado
3. WHEN el endpoint GET /api/ventas retorna la Planilla_Diaria, THE response SHALL incluir venta.fecha para cada elemento en cobranzasExtra
4. THE Backend_Service SHALL mantener el populate existente de cliente con nombre y dirección

### Requirement 2: Mostrar Fecha de Origen en Panel de Cobranzas Extra

**User Story:** Como usuario visualizando el arqueo diario, quiero ver claramente cuándo se originó cada deuda cobrada, para evaluar la antigüedad de las cobranzas.

#### Acceptance Criteria

1. WHEN el Frontend_Component renderiza el panel "COBRANZAS EXTRA", THE Frontend_Component SHALL mostrar la fecha de origen de cada cobranza
2. THE Frontend_Component SHALL formatear la fecha como "(Deuda del DD/MM)"
3. THE Frontend_Component SHALL aplicar estilos text-xs y text-slate-400 al texto de fecha
4. WHEN venta.fecha no está disponible, THE Frontend_Component SHALL omitir el texto de fecha sin generar errores

### Requirement 3: Mostrar Fecha de Pago en Tickets Fiados Parcialmente Pagados

**User Story:** Como usuario revisando la planilla diaria, quiero ver cuándo se realizó un pago parcial en un ticket fiado, para tener claridad sobre el flujo de pagos.

#### Acceptance Criteria

1. WHEN el Frontend_Component renderiza la tabla principal en la columna "ABONO/PAGADO", THE Frontend_Component SHALL verificar si el ticket es fiado Y tiene monto_pagado mayor a cero
2. WHEN un ticket cumple ambas condiciones, THE Frontend_Component SHALL mostrar el monto pagado y debajo el texto "(Pagado el DD/MM)"
3. THE Frontend_Component SHALL formatear la fecha usando venta.updatedAt
4. THE Frontend_Component SHALL aplicar estilos text-xs al texto de fecha de pago
5. WHEN un ticket es fiado pero monto_pagado es cero, THE Frontend_Component SHALL mostrar solo el monto sin texto adicional

### Requirement 4: Formateo Consistente de Fechas

**User Story:** Como usuario del sistema, quiero que todas las fechas se muestren en un formato consistente, para facilitar la lectura y comprensión.

#### Acceptance Criteria

1. THE Frontend_Component SHALL formatear todas las fechas en formato DD/MM
2. WHEN una fecha es del año actual, THE Frontend_Component SHALL omitir el año
3. WHEN una fecha es de un año diferente, THE Frontend_Component SHALL incluir el año como DD/MM/YYYY
4. THE Frontend_Component SHALL manejar fechas inválidas o undefined sin generar errores de renderizado
