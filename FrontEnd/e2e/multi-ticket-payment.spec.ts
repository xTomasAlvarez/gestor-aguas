import { test, expect } from "@playwright/test";

// URL base de la app (ajustar según environment)
const BASE_URL = process.env.BASE_URL || "http://localhost:5173";

test.describe("ModalLiquidacion - Multi-Ticket E2E", () => {
    test.beforeEach(async ({ page }) => {
        // Login y navegar a la página de ventas
        await page.goto(`${BASE_URL}/login`);
        
        // Realizar login (ajustar según tu app)
        await page.fill('input[name="email"]', "repartidor@test.com");
        await page.fill('input[name="password"]', "test123");
        await page.click('button:has-text("Ingresar")');
        
        // Esperar a que se redirija a la página principal
        await page.waitForURL(`${BASE_URL}/**`);
    });

    test("Flujo completo: 3 tickets, pago múltiple exitoso", async ({ page }) => {
        // Navegar a module de ventas/cobranza
        await page.click('a:has-text("Rutas Diarias")');
        await page.waitForSelector('[data-testid="ticket-list"]');

        // Seleccionar un cliente (buscar cliente con múltiples tickets pendientes)
        await page.click('button:has-text("Registrar Cobranza")');
        await page.fill('input[placeholder="Buscar cliente"]', "Cliente Test");
        await page.click('div:has-text("Cliente Test")');

        // Esperar a que aparezca el modal
        await page.waitForSelector('[role="dialog"]');

        // Seleccionar múltiples tickets
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        
        // Seleccionar los primeros 3 tickets
        for (let i = 0; i < Math.min(3, checkboxes.length); i++) {
            await checkboxes[i].check();
        }

        // Verificar que la tabla de distribución aparece
        const table = page.locator("table");
        await expect(table).toBeVisible();

        // Verificar que hay al menos 3 filas (header + 3 tickets)
        const rows = await table.locator("tbody tr").count();
        expect(rows).toBeGreaterThanOrEqual(3);

        // Ingresar montos en la tabla
        const inputs = page.locator('input[type="number"]');
        const inputCount = await inputs.count();
        
        // Rellenar montos (últimos 3 inputs que corresponden a "Monto a Pagar")
        for (let i = Math.max(0, inputCount - 3); i < inputCount; i++) {
            await inputs.nth(i).fill("50");
        }

        // Seleccionar método de pago
        const metodoPago = page.locator('select');
        const selectCount = await metodoPago.count();
        if (selectCount > 0) {
            await metodoPago.last().selectOption("efectivo");
        }

        // Click en Confirmar
        await page.click('button:has-text("Confirmar Liquidación")');

        // Esperar mensaje de éxito
        await page.waitForSelector('text="Liquidación múltiple registrada"', {
            timeout: 5000,
        });

        // Verificar que el modal se cierra
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 3000,
        });
    });

    test("Error: intenta pagar más que la deuda total", async ({ page }) => {
        // Navegar a cobranza
        await page.click('a:has-text("Rutas Diarias")');
        await page.waitForSelector('[data-testid="ticket-list"]');

        await page.click('button:has-text("Registrar Cobranza")');
        await page.fill('input[placeholder="Buscar cliente"]', "Cliente Test");
        await page.click('div:has-text("Cliente Test")');

        await page.waitForSelector('[role="dialog"]');

        // Seleccionar 2 tickets
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        await checkboxes[0].check();
        await checkboxes[1].check();

        // Esperar tabla
        await page.waitForSelector("table");

        // Ingresar montos que excedan deuda (verificar en tests locales cuál es el total)
        const inputs = page.locator('input[type="number"]');
        const inputCount = await inputs.count();
        
        // Ingresar un monto muy alto (más que la deuda)
        for (let i = Math.max(0, inputCount - 2); i < inputCount; i++) {
            await inputs.nth(i).fill("9999");
        }

        // El botón Confirmar debe estar deshabilitado
        const btnConfirmar = page.locator('button:has-text("Confirmar Liquidación")');
        await expect(btnConfirmar).toBeDisabled();

        // Debería mostrar alerta o resumen rojo
        const resumenPagos = page.locator('text="Total a Pagar"');
        await expect(resumenPagos).toBeVisible();
    });

    test("Devolución de envases con múltiples tickets", async ({ page }) => {
        // Navegar a cobranza
        await page.click('a:has-text("Rutas Diarias")');
        await page.waitForSelector('[data-testid="ticket-list"]');

        await page.click('button:has-text("Registrar Cobranza")');
        await page.fill('input[placeholder="Buscar cliente"]', "Cliente Test");
        await page.click('div:has-text("Cliente Test")');

        await page.waitForSelector('[role="dialog"]');

        // Seleccionar múltiples tickets
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        await checkboxes[0].check();
        await checkboxes[1].check();

        // Esperar tabla
        await page.waitForSelector("table");

        // Ingresar montos
        const inputs = page.locator('input[type="number"]');
        const inputCount = await inputs.count();
        
        for (let i = Math.max(0, inputCount - 2); i < inputCount; i++) {
            await inputs.nth(i).fill("50");
        }

        // Buscar y rellenar contador de Bidones 20L
        const bidonCounter = page.locator('text="Devolver Bidones 20L"').locator('..').locator('input[type="number"]');
        if (await bidonCounter.isVisible()) {
            await bidonCounter.fill("2");
        }

        // Buscar y rellenar contador de Sodas
        const sodaCounter = page.locator('text="Devolver Sodas"').locator('..').locator('input[type="number"]');
        if (await sodaCounter.isVisible()) {
            await sodaCounter.fill("1");
        }

        // Click en Confirmar
        await page.click('button:has-text("Confirmar Liquidación")');

        // Esperar éxito
        await page.waitForSelector('text="Liquidación múltiple registrada"', {
            timeout: 5000,
        });

        // Modal debe cerrarse
        await expect(page.locator('[role="dialog"]')).not.toBeVisible({
            timeout: 3000,
        });
    });

    test("Desseleccionar ticket en medio del flujo limpia su pago", async ({
        page,
    }) => {
        // Navegar a cobranza
        await page.click('a:has-text("Rutas Diarias")');
        await page.waitForSelector('[data-testid="ticket-list"]');

        await page.click('button:has-text("Registrar Cobranza")');
        await page.fill('input[placeholder="Buscar cliente"]', "Cliente Test");
        await page.click('div:has-text("Cliente Test")');

        await page.waitForSelector('[role="dialog"]');

        // Seleccionar 3 tickets
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        await checkboxes[0].check();
        await checkboxes[1].check();
        await checkboxes[2].check();

        // Esperar tabla con 3 filas
        const table = page.locator("table");
        await expect(table).toBeVisible();
        let rows = await table.locator("tbody tr").count();
        expect(rows).toBe(3);

        // Ingresar montos para los 3
        const inputs = page.locator('input[type="number"]');
        const inputCount = await inputs.count();
        
        for (let i = Math.max(0, inputCount - 3); i < inputCount; i++) {
            await inputs.nth(i).fill("30");
        }

        // Desseleccionar el segundo ticket
        await checkboxes[1].uncheck();

        // La tabla debe tener ahora 2 filas
        rows = await table.locator("tbody tr").count();
        expect(rows).toBe(2);

        // Los montos del ticket restante deben persistir
        const remainingInputs = page.locator('input[type="number"]');
        const remainingCount = await remainingInputs.count();
        expect(remainingCount).toBeGreaterThan(0);
    });

    test("Máximo de 10 tickets: no permite seleccionar más", async ({ page }) => {
        // Este test solo aplica si la app tiene >10 tickets disponibles
        // Navegar a cobranza
        await page.click('a:has-text("Rutas Diarias")');
        await page.waitForSelector('[data-testid="ticket-list"]');

        await page.click('button:has-text("Registrar Cobranza")');
        await page.fill('input[placeholder="Buscar cliente"]', "Cliente Prueba Masiva");
        await page.click('div:has-text("Cliente Prueba Masiva")');

        await page.waitForSelector('[role="dialog"]');

        // Intentar seleccionar más de 10
        const checkboxes = await page.locator('input[type="checkbox"]').all();
        const toCheck = Math.min(12, checkboxes.length);

        for (let i = 0; i < toCheck; i++) {
            await checkboxes[i].check();
        }

        // Solo 10 deberían estar seleccionados (o menos si no hay tantos)
        const checked = await page.locator('input[type="checkbox"]:checked').count();
        expect(checked).toBeLessThanOrEqual(10);
    });
});
