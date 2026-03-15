# Plan de Implementación: Mejora de Fechas en Cobranzas Extra

## Resumen

Implementar visualización de fechas en el módulo de Planilla Diaria:
- Backend: Agregar populate de venta.fecha en consulta de cobranzas extra
- Frontend: Crear función formatDate para formateo consistente
- Frontend: Mostrar "(Deuda del DD/MM)" en cobranzas extra
- Frontend: Mostrar "(Pagado el DD/MM)" en tickets fiados con pagos parciales

## Tareas

- [ ] 1. Modificar backend para incluir fecha de venta en cobranzas extra
  - [x] 1.1 Agregar populate de venta.fecha en ventasService.js
    - Modificar el método `obtenerVentas` en `BackEnd/src/services/ventasService.js`
    - Agregar `.populate("venta", "fecha")` a la consulta de cobranzasExtra
    - Mantener el populate existente de cliente
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_
  
  - [x] 1.2 Escribir test de propiedad para populate de venta.fecha
    - **Propiedad 1: Cobranzas Extra Incluyen Fecha de Venta Original**
    - **Valida: Requisitos 1.2, 1.3**
    - Verificar que todas las cobranzas extra incluyan venta.fecha válido
    - _Requisitos: 1.2, 1.3_
  
  - [x] 1.3 Escribir test de propiedad para populate de cliente
    - **Propiedad 2: Cobranzas Extra Mantienen Populate de Cliente**
    - **Valida: Requisito 1.4**
    - Verificar que todas las cobranzas extra mantengan cliente.nombre y cliente.direccion
    - _Requisitos: 1.4_
  
  - [x] 1.4 Escribir tests unitarios para obtenerVentas
    - Test: cobranzasExtra incluye venta.fecha poblado
    - Test: cobranzasExtra mantiene cliente poblado (no-regresión)
    - Test: manejo de venta eliminada (venta es null)
    - _Requisitos: 1.1, 1.2, 1.3, 1.4_

- [x] 2. Crear función de formateo de fechas en frontend
  - [x] 2.1 Implementar función formatDate
    - Crear o modificar `FrontEnd/src/utils/format.js`
    - Implementar formatDate que retorne DD/MM para año actual
    - Implementar formatDate que retorne DD/MM/YYYY para años diferentes
    - Manejar valores inválidos retornando cadena vacía
    - Exportar la función para uso en componentes
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_
  
  - [x] 2.2 Escribir test de propiedad para formato año actual
    - **Propiedad 4: Formato de Fecha para Año Actual**
    - **Valida: Requisitos 4.1, 4.2**
    - Verificar formato DD/MM para fechas del año actual
    - _Requisitos: 4.1, 4.2_
  
  - [x] 2.3 Escribir test de propiedad para formato años diferentes
    - **Propiedad 5: Formato de Fecha para Años Diferentes**
    - **Valida: Requisito 4.3**
    - Verificar formato DD/MM/YYYY para fechas de otros años
    - _Requisitos: 4.3_
  
  - [x] 2.4 Escribir test de propiedad para robustez
    - **Propiedad 8: Robustez ante Fechas Inválidas**
    - **Valida: Requisitos 2.4, 4.4**
    - Verificar que valores inválidos retornen cadena vacía sin excepciones
    - _Requisitos: 2.4, 4.4_
    - **Status**: ✓ PASSED (100 runs)
  
  - [x] 2.5 Escribir tests unitarios para formatDate
    - Test: fecha del año actual retorna DD/MM
    - Test: fecha de año diferente retorna DD/MM/YYYY
    - Test: null retorna ""
    - Test: undefined retorna ""
    - Test: string inválido retorna ""
    - _Requisitos: 4.1, 4.2, 4.3, 4.4_

- [x] 3. Checkpoint - Verificar funcionalidad base
  - Asegurar que todos los tests pasen
  - Verificar que el backend retorne venta.fecha en cobranzasExtra
  - Verificar que formatDate funcione correctamente
  - Preguntar al usuario si hay dudas o ajustes necesarios

- [x] 4. Modificar componente TablaCobranzas para mostrar fecha de origen
  - [x] 4.1 Agregar visualización de fecha en cobranzas extra
    - Modificar componente TablaCobranzas en `FrontEnd/src/pages/PlanillaPage.jsx`
    - Importar formatDate desde utils/format
    - Agregar renderizado condicional de "(Deuda del DD/MM)" usando c.venta?.fecha
    - Aplicar estilos text-xs y text-slate-400
    - Usar optional chaining para manejo seguro de venta null
    - _Requisitos: 2.1, 2.2, 2.3, 2.4_
  
  - [x] 4.2 Escribir tests unitarios para TablaCobranzas
    - Test: renderiza "(Deuda del DD/MM)" cuando venta.fecha existe
    - Test: no renderiza fecha cuando venta.fecha es null
    - Test: no genera errores con venta undefined
    - _Requisitos: 2.1, 2.2, 2.4_

- [x] 5. Modificar componente TablaVentas para mostrar fecha de pago
  - [x] 5.1 Agregar visualización de fecha en tickets fiados con pago parcial
    - Modificar columna "ABONO/PAGADO" en TablaVentas en `FrontEnd/src/pages/PlanillaPage.jsx`
    - Agregar renderizado condicional de "(Pagado el DD/MM)" para tickets fiados con monto_pagado > 0
    - Usar v.updatedAt como fuente de fecha
    - Aplicar estilos text-xs y text-slate-400
    - Verificar condiciones: metodo_pago === "fiado" AND monto_pagado > 0 AND updatedAt existe
    - _Requisitos: 3.1, 3.2, 3.3, 3.4, 3.5_
  
  - [x] 5.2 Escribir tests unitarios para TablaVentas
    - Test: renderiza "(Pagado el DD/MM)" para tickets fiados con monto_pagado > 0
    - Test: no renderiza fecha para tickets fiados con monto_pagado === 0
    - Test: no renderiza fecha para tickets no fiados
    - Test: no renderiza fecha si updatedAt no existe
    - _Requisitos: 3.1, 3.2, 3.3, 3.5_

- [x] 6. Checkpoint final - Verificar integración completa
  - Asegurar que todos los tests pasen
  - Verificar que las fechas se muestren correctamente en ambos componentes
  - Verificar manejo de casos edge (venta null, fechas inválidas)
  - Preguntar al usuario si hay ajustes finales necesarios

## Notas

- Las tareas marcadas con `*` son opcionales (tests) y pueden omitirse para un MVP más rápido
- Cada tarea referencia requisitos específicos para trazabilidad
- Los checkpoints aseguran validación incremental
- Los tests de propiedad validan propiedades universales de corrección
- Los tests unitarios validan ejemplos específicos y casos edge
- La implementación es mínimamente invasiva: 1 método backend + 2 componentes frontend
