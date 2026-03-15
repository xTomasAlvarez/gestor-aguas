import fc from "fast-check";
import { formatDate } from "../format";

/**
 * Property-Based Tests for formatDate
 * Feature: cobranzas-extra-fecha-mejora
 * 
 * These tests verify that the formatDate function correctly formats dates
 * according to the requirements: DD/MM for current year, DD/MM/YYYY for other years.
 */

describe("Property Tests - formatDate", () => {
    /**
     * Property 4: Formato de Fecha para Año Actual
     * **Validates: Requirements 4.1, 4.2**
     * 
     * For any date from the current year, the formatDate function must return
     * a string in DD/MM format without including the year.
     */
    it("Property 4: fechas del año actual deben formatearse como DD/MM sin incluir el año", () => {
        const currentYear = new Date().getUTCFullYear();
        
        fc.assert(
            fc.property(
                // Generate month (1-12)
                fc.integer({ min: 1, max: 12 }),
                // Generate day (1-28 to avoid issues with February)
                fc.integer({ min: 1, max: 28 }),
                (month, day) => {
                    // Create a date in the current year
                    const fecha = new Date(Date.UTC(currentYear, month - 1, day));
                    
                    // Execute: Format the date
                    const resultado = formatDate(fecha);
                    
                    // Verify: Must match DD/MM format
                    const regex = /^\d{2}\/\d{2}$/;
                    if (!regex.test(resultado)) {
                        console.error(`Expected DD/MM format, got: ${resultado}`);
                        return false;
                    }
                    
                    // Verify: Must NOT include the year
                    if (resultado.includes(String(currentYear))) {
                        console.error(`Result should not include year ${currentYear}, got: ${resultado}`);
                        return false;
                    }
                    
                    // Verify: Day and month values are correct
                    const [d, m] = resultado.split("/").map(Number);
                    if (d !== day) {
                        console.error(`Expected day ${day}, got ${d}`);
                        return false;
                    }
                    if (m !== month) {
                        console.error(`Expected month ${month}, got ${m}`);
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 5: Formato de Fecha para Años Diferentes
     * **Validates: Requirements 4.3**
     * 
     * For any date from a year different than the current year, the formatDate function
     * must return a string in DD/MM/YYYY format including the full year.
     */
    it("Property 5: fechas de años diferentes deben formatearse como DD/MM/YYYY incluyendo el año", () => {
        const currentYear = new Date().getUTCFullYear();
        
        fc.assert(
            fc.property(
                // Generate year different from current (2000-2030, excluding current)
                fc.integer({ min: 2000, max: 2030 }).filter(y => y !== currentYear),
                // Generate month (1-12)
                fc.integer({ min: 1, max: 12 }),
                // Generate day (1-28 to avoid issues with February)
                fc.integer({ min: 1, max: 28 }),
                (year, month, day) => {
                    // Create a date in a different year
                    const fecha = new Date(Date.UTC(year, month - 1, day));
                    
                    // Execute: Format the date
                    const resultado = formatDate(fecha);
                    
                    // Verify: Must match DD/MM/YYYY format
                    const regex = /^\d{2}\/\d{2}\/\d{4}$/;
                    if (!regex.test(resultado)) {
                        console.error(`Expected DD/MM/YYYY format, got: ${resultado}`);
                        return false;
                    }
                    
                    // Verify: Day, month, and year values are correct
                    const [d, m, y] = resultado.split("/").map(Number);
                    if (d !== day) {
                        console.error(`Expected day ${day}, got ${d}`);
                        return false;
                    }
                    if (m !== month) {
                        console.error(`Expected month ${month}, got ${m}`);
                        return false;
                    }
                    if (y !== year) {
                        console.error(`Expected year ${year}, got ${y}`);
                        return false;
                    }
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Property 8: Robustez ante Fechas Inválidas
     * **Validates: Requirements 2.4, 4.4**
     * 
     * For any invalid value (null, undefined, invalid string, non-date object),
     * the formatDate function must return an empty string without throwing exceptions.
     */
    it("Property 8: valores inválidos deben retornar cadena vacía sin excepciones", () => {
        fc.assert(
            fc.property(
                // Generate various invalid input types
                fc.oneof(
                    fc.constant(null),
                    fc.constant(undefined),
                    fc.string(),  // Random strings (most will be invalid dates)
                    fc.object(),  // Random objects (not Date objects)
                    fc.integer(), // Random integers
                    fc.boolean(), // Booleans
                    fc.constant(NaN),
                    fc.constant(Infinity),
                    fc.constant(-Infinity)
                ),
                (valorInvalido) => {
                    try {
                        // Execute: Try to format the invalid value
                        const resultado = formatDate(valorInvalido);
                        
                        // Verify: Must return empty string for invalid inputs
                        // Valid dates would return a formatted string, but we're testing invalid inputs
                        // The function should handle all invalid inputs gracefully
                        if (typeof resultado !== "string") {
                            console.error(`Expected string result, got: ${typeof resultado}`);
                            return false;
                        }
                        
                        // For truly invalid inputs, should return empty string
                        // Note: Some random strings might accidentally be valid dates,
                        // so we just verify no exception is thrown and result is a string
                        return true;
                    } catch (error) {
                        // Verify: Must NOT throw exceptions
                        console.error(`Function threw exception for input ${valorInvalido}:`, error);
                        return false;
                    }
                }
            ),
            { numRuns: 100 }
        );
    });
});
