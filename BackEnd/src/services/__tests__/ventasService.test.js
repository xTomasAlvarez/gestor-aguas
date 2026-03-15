import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { obtenerVentas } from "../ventasService.js";
import Venta from "../../models/Venta.js";
import Cobranza from "../../models/Cobranza.js";
import Cliente from "../../models/Cliente.js";

/**
 * Unit Tests for ventasService - obtenerVentas
 * Feature: cobranzas-extra-fecha-mejora
 * Task 1.4: Unit tests for obtenerVentas
 * 
 * These tests verify:
 * - cobranzasExtra includes venta.fecha populated
 * - cobranzasExtra maintains cliente populated (non-regression)
 * - Handling of deleted venta (venta is null)
 */

let mongoServer;
let testBusinessId;

beforeAll(async () => {
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    
    await mongoose.connect(mongoUri);
    
    // Create a test business ID
    testBusinessId = new mongoose.Types.ObjectId();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    // Clear all collections before each test
    await Venta.deleteMany({});
    await Cobranza.deleteMany({});
    await Cliente.deleteMany({});
});

describe("obtenerVentas - populate de cobranzas extra", () => {
    /**
     * Test: cobranzasExtra includes venta.fecha populated
     * Validates: Requirements 1.1, 1.2, 1.3
     */
    it("debe incluir venta.fecha poblado en cobranzasExtra", async () => {
        // Setup: Create test data
        const cliente = await Cliente.create({
            nombre: "Juan Pérez",
            direccion: "Calle Test 123",
            telefono: "123456789",
            businessId: testBusinessId
        });
        
        const ventaDate = new Date("2024-03-10T00:00:00.000Z");
        const venta = await Venta.create({
            cliente: cliente._id,
            fecha: ventaDate,
            items: [{
                producto: "Producto Test",
                cantidad: 2,
                precio_unitario: 5000,
                subtotal: 10000
            }],
            total: 10000,
            metodo_pago: "fiado",
            monto_pagado: 0,
            estado: "pendiente",
            businessId: testBusinessId
        });
        
        const cobranzaDate = new Date("2024-03-15T10:00:00.000Z");
        await Cobranza.create({
            venta: venta._id,
            cliente: cliente._id,
            monto: 5000,
            metodoPago: "efectivo",
            fecha: cobranzaDate,
            businessId: testBusinessId
        });
        
        // Execute: Call obtenerVentas with the cobranza date
        const fechaStr = "2024-03-15";
        const result = await obtenerVentas(testBusinessId.toString(), fechaStr);
        
        // Verify: cobranzasExtra should include venta.fecha
        expect(result.cobranzasExtra).toBeDefined();
        expect(result.cobranzasExtra.length).toBe(1);
        
        const cobranza = result.cobranzasExtra[0];
        expect(cobranza.venta).toBeDefined();
        expect(cobranza.venta.fecha).toBeDefined();
        expect(cobranza.venta.fecha).toBeInstanceOf(Date);
        expect(cobranza.venta.fecha.getTime()).toBe(ventaDate.getTime());
    });

    /**
     * Test: cobranzasExtra maintains cliente populated (non-regression)
     * Validates: Requirement 1.4
     */
    it("debe mantener populate de cliente con nombre y direccion", async () => {
        // Setup: Create test data
        const cliente = await Cliente.create({
            nombre: "María García",
            direccion: "Avenida Principal 456",
            telefono: "987654321",
            businessId: testBusinessId
        });
        
        const venta = await Venta.create({
            cliente: cliente._id,
            fecha: new Date("2024-03-10T00:00:00.000Z"),
            items: [{
                producto: "Producto Test",
                cantidad: 1,
                precio_unitario: 8000,
                subtotal: 8000
            }],
            total: 8000,
            metodo_pago: "fiado",
            monto_pagado: 0,
            estado: "pendiente",
            businessId: testBusinessId
        });
        
        await Cobranza.create({
            venta: venta._id,
            cliente: cliente._id,
            monto: 4000,
            metodoPago: "transferencia",
            fecha: new Date("2024-03-15T14:30:00.000Z"),
            businessId: testBusinessId
        });
        
        // Execute: Call obtenerVentas
        const fechaStr = "2024-03-15";
        const result = await obtenerVentas(testBusinessId.toString(), fechaStr);
        
        // Verify: cliente should be populated with nombre and direccion
        expect(result.cobranzasExtra).toBeDefined();
        expect(result.cobranzasExtra.length).toBe(1);
        
        const cobranza = result.cobranzasExtra[0];
        expect(cobranza.cliente).toBeDefined();
        expect(cobranza.cliente.nombre).toBe("María García");
        expect(cobranza.cliente.direccion).toBe("Avenida Principal 456");
        expect(typeof cobranza.cliente.nombre).toBe("string");
        expect(typeof cobranza.cliente.direccion).toBe("string");
    });

    /**
     * Test: handling of deleted venta (venta is null)
     * Validates: Error handling for deleted references
     */
    it("debe manejar correctamente cuando la venta referenciada fue eliminada", async () => {
        // Setup: Create test data
        const cliente = await Cliente.create({
            nombre: "Carlos López",
            direccion: "Boulevard Test 789",
            telefono: "555123456",
            businessId: testBusinessId
        });
        
        const venta = await Venta.create({
            cliente: cliente._id,
            fecha: new Date("2024-03-10T00:00:00.000Z"),
            items: [{
                producto: "Producto Test",
                cantidad: 1,
                precio_unitario: 3000,
                subtotal: 3000
            }],
            total: 3000,
            metodo_pago: "fiado",
            monto_pagado: 0,
            estado: "pendiente",
            businessId: testBusinessId
        });
        
        await Cobranza.create({
            venta: venta._id,
            cliente: cliente._id,
            monto: 3000,
            metodoPago: "efectivo",
            fecha: new Date("2024-03-15T16:00:00.000Z"),
            businessId: testBusinessId
        });
        
        // Delete the venta to simulate a deleted reference
        await Venta.deleteOne({ _id: venta._id });
        
        // Execute: Call obtenerVentas
        const fechaStr = "2024-03-15";
        const result = await obtenerVentas(testBusinessId.toString(), fechaStr);
        
        // Verify: cobranza should still be returned but venta should be null
        expect(result.cobranzasExtra).toBeDefined();
        expect(result.cobranzasExtra.length).toBe(1);
        
        const cobranza = result.cobranzasExtra[0];
        expect(cobranza.venta).toBeNull();
        // Cliente should still be populated
        expect(cobranza.cliente).toBeDefined();
        expect(cobranza.cliente.nombre).toBe("Carlos López");
    });
});
