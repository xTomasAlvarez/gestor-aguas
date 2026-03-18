import { formatDate } from "../format";

describe("formatDate", () => {
    // Get current year for testing
    const currentYear = new Date().getUTCFullYear();
    
    it("debe formatear fecha del año actual sin año", () => {
        // Use current year to test DD/MM format
        const fecha = new Date(Date.UTC(currentYear, 2, 15)); // March 15 of current year
        expect(formatDate(fecha)).toBe("15/03");
    });
    
    it("debe formatear fecha de año diferente con año", () => {
        // Use a past year to test DD/MM/YYYY format
        const fecha = new Date(Date.UTC(currentYear - 1, 11, 25)); // December 25 of last year
        const expected = `25/12/${currentYear - 1}`;
        expect(formatDate(fecha)).toBe(expected);
    });
    
    it("debe retornar cadena vacía para null", () => {
        expect(formatDate(null)).toBe("");
    });
    
    it("debe retornar cadena vacía para undefined", () => {
        expect(formatDate(undefined)).toBe("");
    });
    
    it("debe retornar cadena vacía para string inválido", () => {
        expect(formatDate("invalid-date")).toBe("");
    });
    
    it("debe manejar fechas como strings ISO del año actual", () => {
        // Use current year for ISO string test
        const isoString = `${currentYear}-05-20`;
        expect(formatDate(isoString)).toBe("20/05");
    });
    
    it("debe incluir año para fechas de años anteriores", () => {
        const fecha = new Date(Date.UTC(currentYear - 2, 0, 1)); // January 1, two years ago
        const expected = `01/01/${currentYear - 2}`;
        expect(formatDate(fecha)).toBe(expected);
    });
    
    it("debe incluir año para fechas de años futuros", () => {
        const fecha = new Date(Date.UTC(currentYear + 1, 11, 31)); // December 31, next year
        const expected = `31/12/${currentYear + 1}`;
        expect(formatDate(fecha)).toBe(expected);
    });
});
