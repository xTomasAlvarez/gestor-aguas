import fc from "fast-check";
import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { obtenerVentas } from "../ventasService.js";
import Venta from "../../models/Venta.js";
import Cobranza from "../../models/Cobranza.js";
import Cliente from "../../models/Cliente.js";

/**
 * Property-Based Tests for ventasService
 * Feature: cobranzas-extra-fecha-mejora
 * 
 * These tests verify that the obtenerVentas service correctly populates
 * the venta.fecha field for all cobranzas extra returned.
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

describe("Property Tests - obtenerVentas", () => {
    /**
     * Property 1: Cobranzas Extra Incluyen Fecha de Venta Original
     * **Validates: Requirements 1.2, 1.3**
     * 
     * For any cobranza extra returned by obtenerVentas when a date is specified,
     * the object must include the venta.fecha field populated with a valid Date value.
     */
    it("Property 1: todas las cobranzas extra deben incluir venta.fecha válido", async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a random date for the query (filter out invalid dates)
                fc.date({ 
                    min: new Date("2020-01-01"), 
                    max: new Date("2025-12-31") 
                }).filter(d => !isNaN(d.getTime())),
                // Generate number of cobranzas to create (1-10)
                fc.integer({ min: 1, max: 10 }),
                async (queryDate, numCobranzas) => {
                    // Setup: Create test data
                    // Create a unique cliente for each test run
                    const uniqueId = Date.now() + Math.random();
                    const cliente = await Cliente.create({
                        nombre: `Test Cliente ${uniqueId}`,
                        direccion: `Test Direccion ${uniqueId}`,
                        telefono: `${Math.floor(Math.random() * 1000000000)}`,
                        businessId: testBusinessId
                    });
                    
                    // Create ventas with dates before the query date
                    const ventas = [];
                    for (let i = 0; i < numCobranzas; i++) {
                        const ventaDate = new Date(queryDate);
                        ventaDate.setDate(ventaDate.getDate() - (i + 1)); // Days before query date
                        
                        // Skip if the date becomes invalid
                        if (isNaN(ventaDate.getTime())) continue;
                        
                        const venta = await Venta.create({
                            cliente: cliente._id,
                            fecha: ventaDate,
                            items: [{
                                producto: "Test Producto",
                                cantidad: 1,
                                precio_unitario: 1000,
                                subtotal: 1000
                            }],
                            total: 1000,
                            metodo_pago: "fiado",
                            monto_pagado: 0,
                            estado: "pendiente",
                            businessId: testBusinessId
                        });
                        ventas.push(venta);
                    }
                    
                    // Create cobranzas on the query date
                    for (const venta of ventas) {
                        await Cobranza.create({
                            venta: venta._id,
                            cliente: cliente._id,
                            monto: 500,
                            metodoPago: "efectivo",
                            fecha: queryDate,
                            businessId: testBusinessId
                        });
                    }
                    
                    // Execute: Call obtenerVentas
                    const fechaStr = queryDate.toISOString().split("T")[0];
                    const result = await obtenerVentas(testBusinessId.toString(), fechaStr);
                    
                    // Verify: All cobranzas extra must have valid venta.fecha
                    const allHaveValidFecha = result.cobranzasExtra.every(c => {
                        // Check that venta exists
                        if (!c.venta) return false;
                        
                        // Check that venta.fecha exists
                        if (!c.venta.fecha) return false;
                        
                        // Check that venta.fecha is a Date instance
                        if (!(c.venta.fecha instanceof Date)) return false;
                        
                        // Check that the date is not NaN
                        if (isNaN(c.venta.fecha.getTime())) return false;
                        
                        return true;
                    });
                    
                    return allHaveValidFecha;
                }
            ),
            { numRuns: 100 }
        );
    }, 60000); // 60 second timeout for property test

    /**
     * Property 2: Cobranzas Extra Mantienen Populate de Cliente
     * **Validates: Requirements 1.4**
     * 
     * For any cobranza extra returned by obtenerVentas, the object must include
     * the cliente field populated with the nombre and direccion subfields.
     */
    it("Property 2: todas las cobranzas extra deben mantener populate de cliente con nombre y direccion", async () => {
        await fc.assert(
            fc.asyncProperty(
                // Generate a random date for the query
                fc.date({ 
                    min: new Date("2020-01-01"), 
                    max: new Date("2025-12-31") 
                }).filter(d => !isNaN(d.getTime())),
                // Generate number of cobranzas to create (1-10)
                fc.integer({ min: 1, max: 10 }),
                async (queryDate, numCobranzas) => {
                    // Setup: Create test data
                    // Create a unique cliente for each test run
                    const uniqueId = Date.now() + Math.random();
                    const cliente = await Cliente.create({
                        nombre: `Test Cliente ${uniqueId}`,
                        direccion: `Test Direccion ${uniqueId}`,
                        telefono: `${Math.floor(Math.random() * 1000000000)}`,
                        businessId: testBusinessId
                    });
                    
                    // Create ventas with dates before the query date
                    const ventas = [];
                    for (let i = 0; i < numCobranzas; i++) {
                        const ventaDate = new Date(queryDate);
                        ventaDate.setDate(ventaDate.getDate() - (i + 1)); // Days before query date
                        
                        // Skip if the date becomes invalid
                        if (isNaN(ventaDate.getTime())) continue;
                        
                        const venta = await Venta.create({
                            cliente: cliente._id,
                            fecha: ventaDate,
                            items: [{
                                producto: "Test Producto",
                                cantidad: 1,
                                precio_unitario: 1000,
                                subtotal: 1000
                            }],
                            total: 1000,
                            metodo_pago: "fiado",
                            monto_pagado: 0,
                            estado: "pendiente",
                            businessId: testBusinessId
                        });
                        ventas.push(venta);
                    }
                    
                    // Create cobranzas on the query date
                    for (const venta of ventas) {
                        await Cobranza.create({
                            venta: venta._id,
                            cliente: cliente._id,
                            monto: 500,
                            metodoPago: "efectivo",
                            fecha: queryDate,
                            businessId: testBusinessId
                        });
                    }
                    
                    // Execute: Call obtenerVentas
                    const fechaStr = queryDate.toISOString().split("T")[0];
                    const result = await obtenerVentas(testBusinessId.toString(), fechaStr);
                    
                    // Verify: All cobranzas extra must have cliente populated with nombre and direccion
                    const allHaveValidCliente = result.cobranzasExtra.every(c => {
                        // Check that cliente exists
                        if (!c.cliente) return false;
                        
                        // Check that cliente.nombre exists and is a string
                        if (!c.cliente.nombre || typeof c.cliente.nombre !== "string") return false;
                        
                        // Check that cliente.direccion exists and is a string
                        if (!c.cliente.direccion || typeof c.cliente.direccion !== "string") return false;
                        
                        return true;
                    });
                    
                    return allHaveValidCliente;
                }
            ),
            { numRuns: 100 }
        );
    }, 60000); // 60 second timeout for property test
});
