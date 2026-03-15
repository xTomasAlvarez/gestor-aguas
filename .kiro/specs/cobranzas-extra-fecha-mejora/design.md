# Documento de Diseño Técnico

## Overview

Esta mejora agrega información temporal a las cobranzas extra y tickets fiados en el módulo de Planilla Diaria. El sistema actualmente muestra cobranzas de deudas previas sin indicar cuándo se originó la deuda, dificultando el seguimiento. Esta funcionalidad implementa:

1. **Backend**: Modificación de la consulta de cobranzas extra para incluir la fecha de la venta original mediante populate
2. **Frontend**: Visualización de "(Deuda del DD/MM)" en el panel de cobranzas extra
3. **Frontend**: Visualización de "(Pagado el DD/MM)" en tickets fiados con pagos parciales
4. **Frontend**: Función de formateo consistente de fechas en formato DD/MM (o DD/MM/YYYY para años diferentes)

La solución es mínimamente invasiva, requiriendo cambios en un solo método del backend y en dos componentes de renderizado del frontend.

## Architecture

### Componentes Afectados

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  PlanillaPage.jsx                                      │ │
│  │  ┌──────────────────┐  ┌──────────────────────────┐   │ │
│  │  │ TablaVentas      │  │ TablaCobranzas           │   │ │
│  │  │ - Renderiza      │  │ - Renderiza cobranzas    │   │ │
│  │  │   tickets fiados │  │   extra con fecha origen │   │ │
│  │  │   con fecha pago │  │                          │   │ │
│  │  └──────────────────┘  └──────────────────────────┘   │ │
│  │           │                        │                   │ │
│  │           └────────────┬───────────┘                   │ │
│  │                        │                               │ │
│  │                  ┌─────▼──────┐                        │ │
│  │                  │ formatDate │                        │ │
│  │                  │  (nueva)   │                        │ │
│  │                  └────────────┘                        │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           │ HTTP GET /api/ventas?fecha=X    │
└───────────────────────────┼─────────────────────────────────┘
                            │
┌───────────────────────────▼─────────────────────────────────┐
│                        Backend                               │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  ventasService.js                                      │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │ obtenerVentas()                                  │ │ │
│  │  │ - Consulta Venta (sin cambios)                   │ │ │
│  │  │ - Consulta Cobranza con populate("venta", "fecha")│ │ │
│  │  │ - Mantiene populate("cliente", "nombre direccion")│ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
│                           │                                 │
│                           │ MongoDB Query                   │
└───────────────────────────┼─────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │   MongoDB      │
                    │ ┌────────────┐ │
                    │ │ Cobranza   │ │
                    │ │  - venta → │ │
                    │ │  - cliente │ │
                    │ └────────────┘ │
                    │ ┌────────────┐ │
                    │ │ Venta      │ │
                    │ │  - fecha   │ │
                    │ └────────────┘ │
                    └────────────────┘
```

### Flujo de Datos

1. **Usuario selecciona fecha** en PlanillaPage
2. **Frontend solicita** datos vía `GET /api/ventas?fecha=YYYY-MM-DD`
3. **Backend consulta** colección Cobranza con populate de venta.fecha y cliente
4. **Backend retorna** `{ ventas: [...], cobranzasExtra: [...] }` donde cada cobranza incluye `venta.fecha`
5. **Frontend renderiza**:
   - TablaCobranzas: muestra "(Deuda del DD/MM)" usando `venta.fecha`
   - TablaVentas: muestra "(Pagado el DD/MM)" usando `venta.updatedAt` para tickets fiados con `monto_pagado > 0`

## Components and Interfaces

### Backend: ventasService.js

#### Método Modificado: `obtenerVentas`

**Ubicación**: `BackEnd/src/services/ventasService.js`

**Cambio Requerido**:
```javascript
// ANTES
const cobranzasExtra = await Cobranza.find({
    businessId,
    fecha: { $gte: inicio, $lte: fin }
}).populate("cliente", "nombre direccion").sort({ fecha: -1 });

// DESPUÉS
const cobranzasExtra = await Cobranza.find({
    businessId,
    fecha: { $gte: inicio, $lte: fin }
})
.populate("cliente", "nombre direccion")
.populate("venta", "fecha")  // ← NUEVO: agregar populate de venta.fecha
.sort({ fecha: -1 });
```

**Firma del Método** (sin cambios):
```javascript
export const obtenerVentas = async (businessId, fechaStr) => {
    // ...
    return { ventas, cobranzasExtra };
}
```

**Estructura de Respuesta**:
```javascript
{
    ventas: [
        {
            _id: ObjectId,
            cliente: { nombre: String, direccion: String },
            items: Array,
            total: Number,
            monto_pagado: Number,
            metodo_pago: String,
            fecha: Date,
            updatedAt: Date,
            // ...
        }
    ],
    cobranzasExtra: [
        {
            _id: ObjectId,
            cliente: { nombre: String, direccion: String },
            venta: { _id: ObjectId, fecha: Date },  // ← NUEVO
            monto: Number,
            metodoPago: String,
            fecha: Date
        }
    ]
}
```

### Frontend: Utilidad de Formateo

#### Nueva Función: `formatDate`

**Ubicación**: Agregar en `FrontEnd/src/utils/format.js` (o crear si no existe)

**Implementación**:
```javascript
/**
 * Formatea una fecha en formato DD/MM o DD/MM/YYYY
 * @param {Date|string} fecha - Fecha a formatear
 * @returns {string} Fecha formateada o cadena vacía si es inválida
 */
export const formatDate = (fecha) => {
    if (!fecha) return "";
    
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return "";
        
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const currentYear = new Date().getFullYear();
        
        if (year === currentYear) {
            return `${day}/${month}`;
        } else {
            return `${day}/${month}/${year}`;
        }
    } catch {
        return "";
    }
};
```

**Casos de Uso**:
- `formatDate(new Date("2024-03-15"))` → `"15/03"` (si estamos en 2024)
- `formatDate(new Date("2023-12-25"))` → `"25/12/2023"` (si estamos en 2024)
- `formatDate(null)` → `""`
- `formatDate(undefined)` → `""`
- `formatDate("invalid")` → `""`

### Frontend: PlanillaPage.jsx

#### Componente Modificado: `TablaCobranzas`

**Ubicación**: `FrontEnd/src/pages/PlanillaPage.jsx`

**Cambio Requerido**:
```javascript
// Importar la nueva función
import { formatPeso, dayKey, hoyLocal, formatDate } from "../utils/format";

// Modificar el renderizado de cada fila
const TablaCobranzas = ({ cobranzas }) => {
    return (
        <div className="mt-6">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">
                Cobranzas Extra (Fiados anteriores)
            </h3>
            {cobranzas.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">
                    No se registraron cobros de deudas anteriores en este día.
                </p>
            ) : (
                <table className="w-full text-sm border-collapse">
                    <tbody>
                        {cobranzas.map((c) => (
                            <tr key={c._id} className="border-b border-slate-100 last:border-0">
                                <td className="py-2.5">
                                    <p className="font-semibold text-slate-700">
                                        {c.cliente?.nombre || "—"}
                                    </p>
                                    {/* NUEVO: Mostrar fecha de origen */}
                                    {c.venta?.fecha && (
                                        <p className="text-xs text-slate-400">
                                            (Deuda del {formatDate(c.venta.fecha)})
                                        </p>
                                    )}
                                </td>
                                <td className="py-2.5 text-right font-bold text-emerald-700">
                                    {formatPeso(c.monto)}
                                </td>
                                <td className="py-2.5 text-right">
                                    <MetodoBadge metodo={c.metodoPago || c.metodo_pago} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};
```

#### Componente Modificado: `TablaVentas`

**Ubicación**: `FrontEnd/src/pages/PlanillaPage.jsx`

**Cambio Requerido** en la columna "ABONO/PAGADO":
```javascript
<td className="text-right px-3 py-3 font-semibold text-emerald-700">
    {formatPeso(abono)}
    {/* NUEVO: Mostrar fecha de pago para tickets fiados con pago parcial */}
    {v.metodo_pago === "fiado" && v.monto_pagado > 0 && v.updatedAt && (
        <p className="text-xs text-slate-400 mt-0.5">
            (Pagado el {formatDate(v.updatedAt)})
        </p>
    )}
</td>
```

## Data Models

### Modelo Cobranza (sin cambios)

```javascript
{
    _id: ObjectId,
    venta: ObjectId,          // Referencia a Venta
    cliente: ObjectId,        // Referencia a Cliente
    monto: Number,
    metodoPago: String,       // "efectivo" | "transferencia"
    fecha: Date,              // Fecha de la cobranza
    businessId: ObjectId,
    createdAt: Date,
    updatedAt: Date
}
```

### Modelo Venta (sin cambios)

```javascript
{
    _id: ObjectId,
    cliente: ObjectId,
    items: Array,
    total: Number,
    monto_pagado: Number,
    metodo_pago: String,      // "efectivo" | "transferencia" | "fiado"
    fecha: Date,              // Fecha de la venta original
    estado: String,           // "pendiente" | "pago_parcial" | "saldado"
    envases_devueltos: Object,
    businessId: ObjectId,
    createdAt: Date,
    updatedAt: Date           // Se actualiza en cada pago parcial
}
```

### Relaciones

```
Cobranza.venta → Venta._id
Cobranza.cliente → Cliente._id
Venta.cliente → Cliente._id
```

**Populate Requerido**:
- `Cobranza.populate("venta", "fecha")` - Trae solo el campo fecha de la venta
- `Cobranza.populate("cliente", "nombre direccion")` - Mantiene populate existente


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property Reflection

Después de analizar los criterios de aceptación, identifiqué las siguientes redundancias:

- **Criterios 1.2 y 1.3**: Ambos verifican que venta.fecha esté poblado en cobranzasExtra. Se consolidan en Property 1.
- **Criterios 4.1 y 4.2**: Ambos tratan sobre el formato DD/MM para fechas del año actual. Se consolidan en Property 4.
- **Criterios 2.2 y 3.2**: Ambos verifican el formato de fecha, pero en contextos diferentes (cobranzas extra vs tickets fiados). Se mantienen separados por claridad.

Las propiedades finales eliminan redundancia y cada una proporciona validación única.

### Property 1: Cobranzas Extra Incluyen Fecha de Venta Original

*For any* cobranza extra retornada por el endpoint GET /api/ventas cuando se especifica una fecha, el objeto debe incluir el campo `venta.fecha` poblado con un valor de tipo Date válido.

**Validates: Requirements 1.2, 1.3**

### Property 2: Cobranzas Extra Mantienen Populate de Cliente

*For any* cobranza extra retornada por el endpoint GET /api/ventas, el objeto debe incluir el campo `cliente` poblado con los subcampos `nombre` y `direccion`.

**Validates: Requirements 1.4**

### Property 3: Formato de Fecha en Cobranzas Extra

*For any* cobranza extra con `venta.fecha` válido, el texto renderizado en el componente TablaCobranzas debe incluir la cadena "(Deuda del DD/MM)" donde DD/MM corresponde al día y mes de `venta.fecha`.

**Validates: Requirements 2.1, 2.2**

### Property 4: Formato de Fecha para Año Actual

*For any* fecha del año actual, la función `formatDate` debe retornar una cadena en formato "DD/MM" sin incluir el año.

**Validates: Requirements 4.1, 4.2**

### Property 5: Formato de Fecha para Años Diferentes

*For any* fecha de un año diferente al actual, la función `formatDate` debe retornar una cadena en formato "DD/MM/YYYY" incluyendo el año completo.

**Validates: Requirements 4.3**

### Property 6: Tickets Fiados con Pago Parcial Muestran Fecha

*For any* ticket en la tabla principal donde `metodo_pago === "fiado"` AND `monto_pagado > 0`, el texto renderizado en la columna "ABONO/PAGADO" debe incluir la cadena "(Pagado el DD/MM)" donde DD/MM corresponde a la fecha de `updatedAt`.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Tickets Fiados sin Pago No Muestran Fecha

*For any* ticket en la tabla principal donde `metodo_pago === "fiado"` AND `monto_pagado === 0`, el texto renderizado en la columna "ABONO/PAGADO" NO debe incluir texto adicional de fecha, solo el monto.

**Validates: Requirements 3.5**

### Property 8: Robustez ante Fechas Inválidas (Round-trip)

*For any* valor inválido (null, undefined, cadena inválida, objeto no-fecha), la función `formatDate` debe retornar una cadena vacía sin lanzar excepciones.

**Validates: Requirements 2.4, 4.4**

## Error Handling

### Backend

**Escenario**: La venta referenciada en una cobranza no existe o fue eliminada

**Manejo**: 
- El populate de Mongoose retornará `null` para el campo `venta`
- El frontend debe verificar `c.venta?.fecha` antes de renderizar
- No se muestra texto de fecha si `venta` es null

**Código**:
```javascript
// Backend: populate no falla si la referencia no existe
.populate("venta", "fecha")  // Retorna null si no encuentra

// Frontend: verificación defensiva
{c.venta?.fecha && (
    <p className="text-xs text-slate-400">
        (Deuda del {formatDate(c.venta.fecha)})
    </p>
)}
```

### Frontend

**Escenario 1**: Fecha inválida o undefined

**Manejo**:
- La función `formatDate` retorna cadena vacía
- El componente no renderiza el elemento `<p>` si la fecha es falsy
- No se generan errores de renderizado

**Código**:
```javascript
export const formatDate = (fecha) => {
    if (!fecha) return "";
    try {
        const date = new Date(fecha);
        if (isNaN(date.getTime())) return "";
        // ...
    } catch {
        return "";
    }
};
```

**Escenario 2**: Cobranza sin campo venta poblado

**Manejo**:
- Uso de optional chaining (`?.`) para acceso seguro
- Renderizado condicional con `&&`
- El componente muestra solo nombre del cliente sin fecha

**Código**:
```javascript
{c.venta?.fecha && (
    <p className="text-xs text-slate-400">
        (Deuda del {formatDate(c.venta.fecha)})
    </p>
)}
```

**Escenario 3**: Ticket sin updatedAt

**Manejo**:
- Verificación de existencia antes de formatear
- No se muestra texto de fecha de pago si updatedAt no existe

**Código**:
```javascript
{v.metodo_pago === "fiado" && v.monto_pagado > 0 && v.updatedAt && (
    <p className="text-xs text-slate-400 mt-0.5">
        (Pagado el {formatDate(v.updatedAt)})
    </p>
)}
```

### Casos Edge Cubiertos

1. **Venta eliminada después de crear cobranza**: populate retorna null, no se muestra fecha
2. **Fecha con formato incorrecto**: formatDate retorna "", no se renderiza
3. **Timezone issues**: Se usa el objeto Date nativo de JavaScript que maneja conversiones
4. **monto_pagado exactamente 0**: Condición `> 0` previene mostrar fecha
5. **metodo_pago diferente de "fiado"**: Condición explícita previene mostrar fecha incorrectamente

## Testing Strategy

### Enfoque Dual: Unit Tests + Property-Based Tests

Esta funcionalidad requiere ambos tipos de pruebas para cobertura completa:

- **Unit tests**: Verifican ejemplos específicos, casos edge y puntos de integración
- **Property tests**: Verifican propiedades universales a través de múltiples inputs generados

### Backend Testing

#### Unit Tests

**Archivo**: `BackEnd/src/services/__tests__/ventasService.test.js`

**Casos a probar**:
1. `obtenerVentas` con fecha retorna cobranzasExtra con venta.fecha poblado
2. `obtenerVentas` con fecha retorna cobranzasExtra con cliente poblado (no-regresión)
3. `obtenerVentas` con cobranza cuya venta fue eliminada (venta es null)
4. `obtenerVentas` sin fecha no retorna cobranzasExtra (comportamiento existente)

**Ejemplo**:
```javascript
describe("obtenerVentas - populate de cobranzas extra", () => {
    it("debe incluir venta.fecha en cobranzasExtra", async () => {
        const businessId = "test-business-id";
        const fecha = "2024-03-15";
        
        const result = await obtenerVentas(businessId, fecha);
        
        expect(result.cobranzasExtra).toBeDefined();
        result.cobranzasExtra.forEach(cobranza => {
            expect(cobranza.venta).toBeDefined();
            expect(cobranza.venta.fecha).toBeInstanceOf(Date);
        });
    });
    
    it("debe mantener populate de cliente con nombre y direccion", async () => {
        const businessId = "test-business-id";
        const fecha = "2024-03-15";
        
        const result = await obtenerVentas(businessId, fecha);
        
        result.cobranzasExtra.forEach(cobranza => {
            expect(cobranza.cliente).toBeDefined();
            expect(cobranza.cliente.nombre).toBeDefined();
            expect(cobranza.cliente.direccion).toBeDefined();
        });
    });
});
```

#### Property-Based Tests

**Archivo**: `BackEnd/src/services/__tests__/ventasService.properties.test.js`

**Librería**: fast-check (para JavaScript/Node.js)

**Configuración**: Mínimo 100 iteraciones por test

**Property Test 1**: Cobranzas Extra Incluyen Fecha de Venta Original
```javascript
import fc from "fast-check";

describe("Property Tests - obtenerVentas", () => {
    it("Property 1: todas las cobranzas extra deben incluir venta.fecha", async () => {
        // Feature: cobranzas-extra-fecha-mejora, Property 1: For any cobranza extra retornada por el endpoint GET /api/ventas cuando se especifica una fecha, el objeto debe incluir el campo venta.fecha poblado con un valor de tipo Date válido
        
        await fc.assert(
            fc.asyncProperty(
                fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
                async (fecha) => {
                    const fechaStr = fecha.toISOString().split("T")[0];
                    const result = await obtenerVentas(testBusinessId, fechaStr);
                    
                    return result.cobranzasExtra.every(c => 
                        c.venta && 
                        c.venta.fecha instanceof Date &&
                        !isNaN(c.venta.fecha.getTime())
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it("Property 2: todas las cobranzas extra deben mantener populate de cliente", async () => {
        // Feature: cobranzas-extra-fecha-mejora, Property 2: For any cobranza extra retornada por el endpoint GET /api/ventas, el objeto debe incluir el campo cliente poblado con los subcampos nombre y direccion
        
        await fc.assert(
            fc.asyncProperty(
                fc.date({ min: new Date("2020-01-01"), max: new Date("2025-12-31") }),
                async (fecha) => {
                    const fechaStr = fecha.toISOString().split("T")[0];
                    const result = await obtenerVentas(testBusinessId, fechaStr);
                    
                    return result.cobranzasExtra.every(c => 
                        c.cliente &&
                        typeof c.cliente.nombre === "string" &&
                        typeof c.cliente.direccion === "string"
                    );
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

### Frontend Testing

#### Unit Tests

**Archivo**: `FrontEnd/src/utils/__tests__/format.test.js`

**Casos a probar**:
1. `formatDate` con fecha del año actual retorna DD/MM
2. `formatDate` con fecha de año diferente retorna DD/MM/YYYY
3. `formatDate` con null retorna ""
4. `formatDate` con undefined retorna ""
5. `formatDate` con string inválido retorna ""
6. `formatDate` con objeto no-fecha retorna ""

**Ejemplo**:
```javascript
import { formatDate } from "../format";

describe("formatDate", () => {
    beforeAll(() => {
        // Mock de fecha actual para tests consistentes
        jest.useFakeTimers();
        jest.setSystemTime(new Date("2024-06-15"));
    });
    
    afterAll(() => {
        jest.useRealTimers();
    });
    
    it("debe formatear fecha del año actual sin año", () => {
        expect(formatDate(new Date("2024-03-15"))).toBe("15/03");
    });
    
    it("debe formatear fecha de año diferente con año", () => {
        expect(formatDate(new Date("2023-12-25"))).toBe("25/12/2023");
    });
    
    it("debe retornar cadena vacia para null", () => {
        expect(formatDate(null)).toBe("");
    });
    
    it("debe retornar cadena vacia para undefined", () => {
        expect(formatDate(undefined)).toBe("");
    });
    
    it("debe retornar cadena vacia para string invalido", () => {
        expect(formatDate("invalid-date")).toBe("");
    });
});
```

**Archivo**: `FrontEnd/src/pages/__tests__/PlanillaPage.test.jsx`

**Casos a probar**:
1. TablaCobranzas renderiza "(Deuda del DD/MM)" cuando venta.fecha existe
2. TablaCobranzas no renderiza fecha cuando venta.fecha es null
3. TablaVentas renderiza "(Pagado el DD/MM)" para tickets fiados con monto_pagado > 0
4. TablaVentas no renderiza fecha para tickets fiados con monto_pagado === 0
5. TablaVentas no renderiza fecha para tickets no fiados

**Ejemplo**:
```javascript
import { render, screen } from "@testing-library/react";
import PlanillaPage from "../PlanillaPage";

describe("PlanillaPage - Visualización de fechas", () => {
    it("debe mostrar fecha de origen en cobranzas extra", () => {
        const mockCobranzas = [
            {
                _id: "1",
                cliente: { nombre: "Juan Pérez" },
                venta: { fecha: new Date("2024-03-10") },
                monto: 5000,
                metodoPago: "efectivo"
            }
        ];
        
        render(<TablaCobranzas cobranzas={mockCobranzas} />);
        
        expect(screen.getByText(/Deuda del 10\/03/)).toBeInTheDocument();
    });
    
    it("debe mostrar fecha de pago en tickets fiados con pago parcial", () => {
        const mockVentas = [
            {
                _id: "1",
                cliente: { nombre: "María García" },
                metodo_pago: "fiado",
                total: 10000,
                monto_pagado: 5000,
                updatedAt: new Date("2024-03-12"),
                items: []
            }
        ];
        
        render(<TablaVentas ventas={mockVentas} ventasTotales={mockVentas} />);
        
        expect(screen.getByText(/Pagado el 12\/03/)).toBeInTheDocument();
    });
});
```

#### Property-Based Tests

**Archivo**: `FrontEnd/src/utils/__tests__/format.properties.test.js`

**Librería**: fast-check

**Property Test 1**: Formato de Fecha para Año Actual
```javascript
import fc from "fast-check";
import { formatDate } from "../format";

describe("Property Tests - formatDate", () => {
    it("Property 4: fechas del año actual deben formatearse como DD/MM", () => {
        // Feature: cobranzas-extra-fecha-mejora, Property 4: For any fecha del año actual, la función formatDate debe retornar una cadena en formato DD/MM sin incluir el año
        
        const currentYear = new Date().getFullYear();
        
        fc.assert(
            fc.property(
                fc.integer({ min: 1, max: 12 }),  // mes
                fc.integer({ min: 1, max: 28 }),  // día (28 para evitar problemas con febrero)
                (month, day) => {
                    const fecha = new Date(currentYear, month - 1, day);
                    const resultado = formatDate(fecha);
                    
                    // Verificar formato DD/MM
                    const regex = /^\d{2}\/\d{2}$/;
                    if (!regex.test(resultado)) return false;
                    
                    // Verificar que no incluya año
                    if (resultado.includes(String(currentYear))) return false;
                    
                    // Verificar valores correctos
                    const [d, m] = resultado.split("/");
                    return parseInt(d) === day && parseInt(m) === month;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it("Property 5: fechas de años diferentes deben formatearse como DD/MM/YYYY", () => {
        // Feature: cobranzas-extra-fecha-mejora, Property 5: For any fecha de un año diferente al actual, la función formatDate debe retornar una cadena en formato DD/MM/YYYY incluyendo el año completo
        
        const currentYear = new Date().getFullYear();
        
        fc.assert(
            fc.property(
                fc.integer({ min: 2000, max: 2030 }).filter(y => y !== currentYear),
                fc.integer({ min: 1, max: 12 }),
                fc.integer({ min: 1, max: 28 }),
                (year, month, day) => {
                    const fecha = new Date(year, month - 1, day);
                    const resultado = formatDate(fecha);
                    
                    // Verificar formato DD/MM/YYYY
                    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
                    if (!regex.test(resultado)) return false;
                    
                    // Verificar valores correctos
                    const [d, m, y] = resultado.split("/");
                    return parseInt(d) === day && 
                           parseInt(m) === month && 
                           parseInt(y) === year;
                }
            ),
            { numRuns: 100 }
        );
    });
    
    it("Property 8: valores inválidos deben retornar cadena vacía sin excepciones", () => {
        // Feature: cobranzas-extra-fecha-mejora, Property 8: For any valor inválido (null, undefined, cadena inválida, objeto no-fecha), la función formatDate debe retornar una cadena vacía sin lanzar excepciones
        
        fc.assert(
            fc.property(
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.string(),
                    fc.object(),
                    fc.integer()
                ),
                (valorInvalido) => {
                    try {
                        const resultado = formatDate(valorInvalido);
                        return resultado === "";
                    } catch {
                        return false;  // No debe lanzar excepciones
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

### Integration Tests

**Archivo**: `FrontEnd/src/pages/__tests__/PlanillaPage.integration.test.jsx`

**Casos a probar**:
1. Flujo completo: fetch de datos → renderizado de cobranzas con fechas
2. Flujo completo: fetch de datos → renderizado de tickets fiados con fechas de pago
3. Manejo de respuesta del API sin venta.fecha (backward compatibility)

**Ejemplo**:
```javascript
import { render, screen, waitFor } from "@testing-library/react";
import { rest } from "msw";
import { setupServer } from "msw/node";
import PlanillaPage from "../PlanillaPage";

const server = setupServer(
    rest.get("/api/ventas", (req, res, ctx) => {
        return res(ctx.json({
            ventas: [],
            cobranzasExtra: [
                {
                    _id: "1",
                    cliente: { nombre: "Test Cliente", direccion: "Test Dir" },
                    venta: { _id: "v1", fecha: "2024-03-10T00:00:00.000Z" },
                    monto: 5000,
                    metodoPago: "efectivo"
                }
            ]
        }));
    })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe("Integration Tests - PlanillaPage con fechas", () => {
    it("debe mostrar cobranzas extra con fecha de origen desde el API", async () => {
        render(<PlanillaPage />);
        
        await waitFor(() => {
            expect(screen.getByText("Test Cliente")).toBeInTheDocument();
            expect(screen.getByText(/Deuda del 10\/03/)).toBeInTheDocument();
        });
    });
});
```

### Resumen de Cobertura

| Componente | Unit Tests | Property Tests | Integration Tests |
|------------|------------|----------------|-------------------|
| Backend: obtenerVentas | ✓ | ✓ | - |
| Frontend: formatDate | ✓ | ✓ | - |
| Frontend: TablaCobranzas | ✓ | - | ✓ |
| Frontend: TablaVentas | ✓ | - | ✓ |

**Total de Property Tests**: 4 (2 backend + 2 frontend)
**Iteraciones por test**: 100 mínimo
**Cobertura esperada**: >90% de las líneas modificadas
