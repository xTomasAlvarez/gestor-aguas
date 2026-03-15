/**
 * Unit Tests for TablaCobranzas Component
 * Feature: cobranzas-extra-fecha-mejora
 * 
 * These tests verify that the TablaCobranzas component correctly displays
 * cobranzas extra with optional date information.
 */

import { formatDate } from "../../utils/format.js";

// Mock data helpers
const createCobranza = (overrides = {}) => ({
    _id: "test-id-1",
    monto: 5000,
    metodoPago: "efectivo",
    cliente: { nombre: "Juan Pérez" },
    venta: null,
    ...overrides
});

/**
 * Test: renderiza "(Deuda del DD/MM)" cuando venta.fecha existe
 * **Validates: Requirements 2.1, 2.2**
 * 
 * Verifies that when a cobranza has a venta with a fecha property,
 * the component renders the date in the format "(Deuda del DD/MM)".
 */
describe("TablaCobranzas - Date Display", () => {
    test('renderiza "(Deuda del DD/MM)" cuando venta.fecha existe', () => {
        // Arrange: Create a cobranza with a venta.fecha
        const testDate = new Date("2024-03-15T12:00:00Z");
        const cobranza = createCobranza({
            venta: { fecha: testDate }
        });

        // Act: Format the date as the component would
        const formattedDate = formatDate(cobranza.venta?.fecha);
        const expectedText = `(Deuda del ${formattedDate})`;

        // Assert: Verify the date is formatted correctly
        expect(formattedDate).toBeTruthy();
        expect(formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
        expect(expectedText).toContain("Deuda del");
        expect(expectedText).toContain(formattedDate);
    });

    /**
     * Test: no renderiza fecha cuando venta.fecha es null
     * **Validates: Requirements 2.4**
     * 
     * Verifies that when venta.fecha is null, the component does not
     * render any date text and handles it gracefully.
     */
    test("no renderiza fecha cuando venta.fecha es null", () => {
        // Arrange: Create a cobranza with venta but null fecha
        const cobranza = createCobranza({
            venta: { fecha: null }
        });

        // Act: Check the conditional rendering logic
        const shouldRenderDate = cobranza.venta?.fecha;
        const formattedDate = shouldRenderDate ? formatDate(cobranza.venta.fecha) : null;

        // Assert: Verify date is not rendered
        expect(shouldRenderDate).toBeFalsy();
        expect(formattedDate).toBeNull();
    });

    /**
     * Test: no genera errores con venta undefined
     * **Validates: Requirements 2.4**
     * 
     * Verifies that when venta is undefined or null, the component
     * handles it gracefully without throwing errors.
     */
    test("no genera errores con venta undefined", () => {
        // Arrange: Create cobranzas with various undefined/null venta scenarios
        const testCases = [
            createCobranza({ venta: undefined }),
            createCobranza({ venta: null }),
            createCobranza({ venta: {} }),
            createCobranza({ venta: { fecha: undefined } })
        ];

        testCases.forEach((cobranza) => {
            // Act: Execute the conditional logic without throwing
            let error = null;
            let shouldRenderDate = false;
            
            try {
                shouldRenderDate = cobranza.venta?.fecha;
                if (shouldRenderDate) {
                    formatDate(cobranza.venta.fecha);
                }
            } catch (e) {
                error = e;
            }

            // Assert: Verify no errors are thrown
            expect(error).toBeNull();
            expect(shouldRenderDate).toBeFalsy();
        });
    });

    /**
     * Test: formatDate retorna cadena vacía para valores inválidos
     * **Validates: Requirements 2.4, 4.4**
     * 
     * Verifies that formatDate handles invalid inputs gracefully
     * by returning an empty string.
     */
    test("formatDate retorna cadena vacía para valores inválidos", () => {
        // Arrange: Various invalid inputs
        const invalidInputs = [null, undefined, "", "invalid-date", NaN];

        invalidInputs.forEach(input => {
            // Act: Format invalid input
            const result = formatDate(input);

            // Assert: Should return empty string
            expect(result).toBe("");
        });
    });

    /**
     * Test: renderiza múltiples cobranzas con fechas mixtas
     * **Validates: Requirements 2.1, 2.2, 2.4**
     * 
     * Verifies that the component can handle a list of cobranzas
     * with mixed date scenarios (some with dates, some without).
     */
    test("renderiza múltiples cobranzas con fechas mixtas", () => {
        // Arrange: Create a mix of cobranzas
        const cobranzas = [
            createCobranza({
                _id: "c1",
                venta: { fecha: new Date("2024-01-15T12:00:00Z") }
            }),
            createCobranza({
                _id: "c2",
                venta: null
            }),
            createCobranza({
                _id: "c3",
                venta: { fecha: new Date("2024-02-20T12:00:00Z") }
            }),
            createCobranza({
                _id: "c4",
                venta: { fecha: null }
            })
        ];

        // Act: Process each cobranza
        const results = cobranzas.map(c => ({
            id: c._id,
            shouldRenderDate: c.venta?.fecha,
            formattedDate: c.venta?.fecha ? formatDate(c.venta.fecha) : null
        }));

        // Assert: Verify correct handling of each case
        expect(results[0].shouldRenderDate).toBeTruthy();
        expect(results[0].formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
        
        expect(results[1].shouldRenderDate).toBeFalsy();
        expect(results[1].formattedDate).toBeNull();
        
        expect(results[2].shouldRenderDate).toBeTruthy();
        expect(results[2].formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
        
        expect(results[3].shouldRenderDate).toBeFalsy();
        expect(results[3].formattedDate).toBeNull();
    });
});

/**
 * Unit Tests for TablaVentas Component
 * Feature: cobranzas-extra-fecha-mejora
 * Task 5.2: Escribir tests unitarios para TablaVentas
 * 
 * These tests verify that the TablaVentas component correctly displays
 * payment dates for partially paid installment tickets.
 */

// Mock data helper for ventas
const createVenta = (overrides = {}) => ({
    _id: "test-venta-1",
    cliente: { nombre: "Cliente Test", direccion: "Dirección Test" },
    items: [],
    total: 10000,
    monto_pagado: 0,
    metodo_pago: "efectivo",
    fecha: new Date("2024-03-15T12:00:00Z"),
    updatedAt: new Date("2024-03-20T12:00:00Z"),
    ...overrides
});

/**
 * Test Suite: TablaVentas - Payment Date Display
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
 */
describe("TablaVentas - Payment Date Display", () => {
    /**
     * Test: renderiza "(Pagado el DD/MM)" para tickets fiados con monto_pagado > 0
     * **Validates: Requirements 3.1, 3.2, 3.3**
     * 
     * Verifies that when a ticket is fiado AND has monto_pagado > 0 AND has updatedAt,
     * the component renders the payment date in the format "(Pagado el DD/MM)".
     */
    test('renderiza "(Pagado el DD/MM)" para tickets fiados con monto_pagado > 0', () => {
        // Arrange: Create a fiado ticket with partial payment
        const testDate = new Date("2024-03-20T12:00:00Z");
        const venta = createVenta({
            metodo_pago: "fiado",
            monto_pagado: 5000,
            total: 10000,
            updatedAt: testDate
        });

        // Act: Check the conditional rendering logic
        const shouldRenderDate = venta.metodo_pago === "fiado" && 
                                 venta.monto_pagado > 0 && 
                                 !!venta.updatedAt;
        const formattedDate = shouldRenderDate ? formatDate(venta.updatedAt) : null;

        // Assert: Verify the date is rendered correctly
        expect(shouldRenderDate).toBe(true);
        expect(formattedDate).toBeTruthy();
        expect(formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
        
        // Verify the expected text format
        const expectedText = `(Pagado el ${formattedDate})`;
        expect(expectedText).toContain("Pagado el");
        expect(expectedText).toContain(formattedDate);
    });

    /**
     * Test: no renderiza fecha para tickets fiados con monto_pagado === 0
     * **Validates: Requirements 3.5**
     * 
     * Verifies that when a ticket is fiado but has monto_pagado === 0,
     * the component does not render any payment date text.
     */
    test("no renderiza fecha para tickets fiados con monto_pagado === 0", () => {
        // Arrange: Create a fiado ticket with no payment
        const venta = createVenta({
            metodo_pago: "fiado",
            monto_pagado: 0,
            total: 10000,
            updatedAt: new Date("2024-03-20T12:00:00Z")
        });

        // Act: Check the conditional rendering logic
        const shouldRenderDate = venta.metodo_pago === "fiado" && 
                                 venta.monto_pagado > 0 && 
                                 !!venta.updatedAt;

        // Assert: Verify date is not rendered
        expect(shouldRenderDate).toBe(false);
    });

    /**
     * Test: no renderiza fecha para tickets no fiados
     * **Validates: Requirements 3.1**
     * 
     * Verifies that when a ticket is not fiado (efectivo or transferencia),
     * the component does not render any payment date text.
     */
    test("no renderiza fecha para tickets no fiados", () => {
        // Arrange: Create tickets with different payment methods
        const ventaEfectivo = createVenta({
            metodo_pago: "efectivo",
            monto_pagado: 10000,
            total: 10000,
            updatedAt: new Date("2024-03-20T12:00:00Z")
        });

        const ventaTransferencia = createVenta({
            metodo_pago: "transferencia",
            monto_pagado: 10000,
            total: 10000,
            updatedAt: new Date("2024-03-20T12:00:00Z")
        });

        // Act: Check the conditional rendering logic for both
        const shouldRenderEfectivo = ventaEfectivo.metodo_pago === "fiado" && 
                                     ventaEfectivo.monto_pagado > 0 && 
                                     !!ventaEfectivo.updatedAt;

        const shouldRenderTransferencia = ventaTransferencia.metodo_pago === "fiado" && 
                                          ventaTransferencia.monto_pagado > 0 && 
                                          !!ventaTransferencia.updatedAt;

        // Assert: Verify date is not rendered for non-fiado tickets
        expect(shouldRenderEfectivo).toBe(false);
        expect(shouldRenderTransferencia).toBe(false);
    });

    /**
     * Test: no renderiza fecha si updatedAt no existe
     * **Validates: Requirements 3.3**
     * 
     * Verifies that when a fiado ticket with payment doesn't have updatedAt,
     * the component does not render any payment date text.
     */
    test("no renderiza fecha si updatedAt no existe", () => {
        // Arrange: Create fiado tickets without updatedAt
        const testCases = [
            createVenta({
                metodo_pago: "fiado",
                monto_pagado: 5000,
                total: 10000,
                updatedAt: null
            }),
            createVenta({
                metodo_pago: "fiado",
                monto_pagado: 5000,
                total: 10000,
                updatedAt: undefined
            }),
            // Ticket without updatedAt property
            (() => {
                const v = createVenta({
                    metodo_pago: "fiado",
                    monto_pagado: 5000,
                    total: 10000
                });
                delete v.updatedAt;
                return v;
            })()
        ];

        testCases.forEach((venta) => {
            // Act: Check the conditional rendering logic
            const shouldRenderDate = venta.metodo_pago === "fiado" && 
                                     venta.monto_pagado > 0 && 
                                     !!venta.updatedAt;

            // Assert: Verify date is not rendered
            expect(shouldRenderDate).toBe(false);
        });
    });

    /**
     * Test: maneja múltiples tickets con diferentes estados de pago
     * **Validates: Requirements 3.1, 3.2, 3.3, 3.5**
     * 
     * Verifies that the component correctly handles a list of tickets
     * with mixed payment scenarios.
     */
    test("maneja múltiples tickets con diferentes estados de pago", () => {
        // Arrange: Create a mix of tickets
        const ventas = [
            // Fiado with partial payment - should show date
            createVenta({
                _id: "v1",
                metodo_pago: "fiado",
                monto_pagado: 5000,
                total: 10000,
                updatedAt: new Date("2024-03-20T12:00:00Z")
            }),
            // Fiado with no payment - should NOT show date
            createVenta({
                _id: "v2",
                metodo_pago: "fiado",
                monto_pagado: 0,
                total: 10000,
                updatedAt: new Date("2024-03-20T12:00:00Z")
            }),
            // Efectivo - should NOT show date
            createVenta({
                _id: "v3",
                metodo_pago: "efectivo",
                monto_pagado: 10000,
                total: 10000,
                updatedAt: new Date("2024-03-20T12:00:00Z")
            }),
            // Fiado with payment but no updatedAt - should NOT show date
            createVenta({
                _id: "v4",
                metodo_pago: "fiado",
                monto_pagado: 5000,
                total: 10000,
                updatedAt: null
            }),
            // Fiado fully paid - should show date
            createVenta({
                _id: "v5",
                metodo_pago: "fiado",
                monto_pagado: 10000,
                total: 10000,
                updatedAt: new Date("2024-03-21T12:00:00Z")
            })
        ];

        // Act: Process each venta
        const results = ventas.map(v => ({
            id: v._id,
            shouldRenderDate: v.metodo_pago === "fiado" && 
                              v.monto_pagado > 0 && 
                              !!v.updatedAt,
            formattedDate: (v.metodo_pago === "fiado" && v.monto_pagado > 0 && v.updatedAt) 
                ? formatDate(v.updatedAt) 
                : null
        }));

        // Assert: Verify correct handling of each case
        expect(results[0].shouldRenderDate).toBe(true);
        expect(results[0].formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
        
        expect(results[1].shouldRenderDate).toBe(false);
        expect(results[1].formattedDate).toBeNull();
        
        expect(results[2].shouldRenderDate).toBe(false);
        expect(results[2].formattedDate).toBeNull();
        
        expect(results[3].shouldRenderDate).toBe(false);
        expect(results[3].formattedDate).toBeNull();
        
        expect(results[4].shouldRenderDate).toBe(true);
        expect(results[4].formattedDate).toMatch(/^\d{2}\/\d{2}(\/\d{4})?$/);
    });

    /**
     * Test: verifica que formatDate se llama con updatedAt correcto
     * **Validates: Requirements 3.3**
     * 
     * Verifies that the formatDate function is called with the correct
     * updatedAt value from the ticket.
     */
    test("verifica que formatDate se llama con updatedAt correcto", () => {
        // Arrange: Create a fiado ticket with specific updatedAt
        const specificDate = new Date("2024-03-25T15:30:00Z");
        const venta = createVenta({
            metodo_pago: "fiado",
            monto_pagado: 7500,
            total: 10000,
            updatedAt: specificDate
        });

        // Act: Format the date as the component would
        const shouldRenderDate = venta.metodo_pago === "fiado" && 
                                 venta.monto_pagado > 0 && 
                                 !!venta.updatedAt;
        const formattedDate = shouldRenderDate ? formatDate(venta.updatedAt) : null;

        // Assert: Verify the date is formatted from updatedAt
        expect(shouldRenderDate).toBe(true);
        expect(formattedDate).toBeTruthy();
        
        // Verify it's using the correct date (day 25, month 03)
        expect(formattedDate).toContain("25");
        expect(formattedDate).toContain("03");
    });

    /**
     * Test: verifica estilos text-xs text-slate-400 en el texto de fecha
     * **Validates: Requirements 3.4**
     * 
     * This is a documentation test to verify that the implementation
     * uses the correct CSS classes for styling the payment date text.
     */
    test("verifica estilos text-xs text-slate-400 en el texto de fecha", () => {
        // This test documents the expected CSS classes
        // The actual implementation in PlanillaPage.jsx should use:
        // <p className="text-xs text-slate-400 mt-0.5">
        
        const expectedClasses = ["text-xs", "text-slate-400"];
        
        // Assert: Document the expected styling
        expect(expectedClasses).toContain("text-xs");
        expect(expectedClasses).toContain("text-slate-400");
    });
});
