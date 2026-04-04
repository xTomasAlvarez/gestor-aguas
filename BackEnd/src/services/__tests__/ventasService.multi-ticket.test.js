import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { registrarCobranza } from "../ventasService.js";
import Venta from "../../models/Venta.js";
import Cobranza from "../../models/Cobranza.js";
import Cliente from "../../models/Cliente.js";

/**
 * Unit Tests for ventasService - registrarCobranza (Multi-Ticket)
 * Feature: Multi-Ticket Payment (Pago de Múltiples Fiados)
 */

let mongoServer;
let testBusinessId;
let testClienteId;

beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    
    testBusinessId = new mongoose.Types.ObjectId();
    testClienteId = new mongoose.Types.ObjectId();
});

afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
});

beforeEach(async () => {
    await Venta.deleteMany({});
    await Cobranza.deleteMany({});
    await Cliente.deleteMany({});
    
    await Cliente.create({
        _id: testClienteId,
        nombre: "Cliente Test",
        businessId: testBusinessId,
        deuda: { saldo: 0, bidones_20L: 0, bidones_12L: 0, sodas: 0 }
    });
});

describe("registrarCobranza - Multi-Ticket", () => {
    
    it("debe procesar pago de 1 ticket (backward compatibility)", async () => {
        const venta1 = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [
                { producto: "Bidon 20L", cantidad: 2, precio_unitario: 40, subtotal: 80 },
                { producto: "Bidon 12L", cantidad: 1, precio_unitario: 20, subtotal: 20 }
            ],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente"
        });
        
        await Cliente.findByIdAndUpdate(testClienteId, {
            $inc: {
                "deuda.saldo": 100,
                "deuda.bidones_20L": 2,
                "deuda.bidones_12L": 1
            }
        });
        
        const resultado = await registrarCobranza({
            clienteId: testClienteId,
            ticketId: venta1._id,
            montoAbonado: 50,
            envasesDevueltos: { bidones_20L: 1, bidones_12L: 0, sodas: 0 },
            metodoPago: "efectivo"
        }, testBusinessId);
        
        expect(resultado.ventas).toHaveLength(1);
        expect(resultado.ventas[0]._id.toString()).toBe(venta1._id.toString());
        expect(resultado.ventas[0].monto_pagado).toBe(50);
        expect(resultado.ventas[0].estado).toBe("pago_parcial");
        
        const cobranzas = await Cobranza.find({});
        expect(cobranzas).toHaveLength(1);
        expect(cobranzas[0].monto).toBe(50);
        
        const clienteActualizado = await Cliente.findById(testClienteId);
        expect(clienteActualizado.deuda.saldo).toBe(50);
        expect(clienteActualizado.deuda.bidones_20L).toBe(1);
    });
    
    it("debe procesar pago de 2 tickets con distribución manual", async () => {
        const venta1 = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 20L", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente",
            fecha: new Date("2026-03-15")
        });
        
        const venta2 = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 12L", cantidad: 1, precio_unitario: 80, subtotal: 80 }],
            total: 80,
            monto_pagado: 0,
            estado: "pendiente",
            fecha: new Date("2026-03-17")
        });
        
        await Cliente.findByIdAndUpdate(testClienteId, {
            $inc: {
                "deuda.saldo": 180,
                "deuda.bidones_20L": 2,
                "deuda.bidones_12L": 1
            }
        });
        
        const resultado = await registrarCobranza({
            clienteId: testClienteId,
            ticketIds: [venta1._id, venta2._id],
            pagos: [
                { ticketId: venta1._id, monto: 50 },
                { ticketId: venta2._id, monto: 40 }
            ],
            envasesDevueltos: { bidones_20L: 1, bidones_12L: 0, sodas: 0 },
            metodoPago: "efectivo"
        }, testBusinessId);
        
        expect(resultado.ventas).toHaveLength(2);
        expect(resultado.ventas[0].monto_pagado).toBe(50);
        expect(resultado.ventas[1].monto_pagado).toBe(40);
        expect(resultado.ventas[0].estado).toBe("pago_parcial");
        expect(resultado.ventas[1].estado).toBe("pago_parcial");
        
        const cobranzas = await Cobranza.find({});
        expect(cobranzas).toHaveLength(2);
        
        const clienteActualizado = await Cliente.findById(testClienteId);
        expect(clienteActualizado.deuda.saldo).toBe(90);
    });
    
    it("debe deducir envases FIFO: tickets más antiguos primero", async () => {
        const ventaAntigua = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 20L", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente",
            fecha: new Date("2026-03-10"),
            envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 }
        });
        
        const ventaReciente = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 20L", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente",
            fecha: new Date("2026-03-15"),
            envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 }
        });
        
        await Cliente.findByIdAndUpdate(testClienteId, {
            $inc: {
                "deuda.saldo": 200,
                "deuda.bidones_20L": 4
            }
        });
        
        const resultado = await registrarCobranza({
            clienteId: testClienteId,
            ticketIds: [ventaAntigua._id, ventaReciente._id],
            pagos: [
                { ticketId: ventaAntigua._id, monto: 100 },
                { ticketId: ventaReciente._id, monto: 100 }
            ],
            envasesDevueltos: { bidones_20L: 3, bidones_12L: 0, sodas: 0 },
            metodoPago: "efectivo"
        }, testBusinessId);
        
        // FIFO: Ticket antiguo (más viejo) se liquida primero y obtiene sus 2 bidones primero
        expect(resultado.ventas[0].envases_devueltos.bidones_20L).toBe(2);
        expect(resultado.ventas[0].monto_pagado).toBe(100);
        expect(resultado.ventas[0].estado).toBe("saldado");
        
        // Ticket reciente obtiene 1 de sus 2 bidones (el tercero)
        expect(resultado.ventas[1].envases_devueltos.bidones_20L).toBe(1);
        expect(resultado.ventas[1].monto_pagado).toBe(100);
        expect(resultado.ventas[1].estado).toBe("pago_parcial");
    });
    
    it("debe hacer rollback si una transacción falla", async () => {
        const ventaValida = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 20L", cantidad: 1, precio_unitario: 100, subtotal: 100 }],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente"
        });
        
        const ventaSaldada = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 12L", cantidad: 1, precio_unitario: 80, subtotal: 80 }],
            total: 80,
            monto_pagado: 80,
            estado: "saldado"
        });
        
        await Cliente.findByIdAndUpdate(testClienteId, {
            $inc: {
                "deuda.saldo": 100,
                "deuda.bidones_20L": 1,
                "deuda.bidones_12L": 1
            }
        });
        
        const clienteAntesRollback = await Cliente.findById(testClienteId);
        const deudaOriginal = clienteAntesRollback.deuda.saldo;
        
        try {
            await registrarCobranza({
                clienteId: testClienteId,
                ticketIds: [ventaValida._id, ventaSaldada._id],
                pagos: [
                    { ticketId: ventaValida._id, monto: 50 },
                    { ticketId: ventaSaldada._id, monto: 40 }
                ],
                envasesDevueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 },
                metodoPago: "efectivo"
            }, testBusinessId);
            
            expect(true).toBe(false);
        } catch (error) {
            expect(error.message).toContain("saldados");
        }
        
        const ventaValidaPostError = await Venta.findById(ventaValida._id);
        expect(ventaValidaPostError.monto_pagado).toBe(0);
        
        const cobranzasPostError = await Cobranza.find({});
        expect(cobranzasPostError).toHaveLength(0);
        
        const clientePostError = await Cliente.findById(testClienteId);
        expect(clientePostError.deuda.saldo).toBe(deudaOriginal);
    });
    
    it("debe marcar ticket como 'saldado' cuando pago + envases completos", async () => {
        const venta = await Venta.create({
            businessId: testBusinessId,
            cliente: testClienteId,
            items: [{ producto: "Bidon 20L", cantidad: 2, precio_unitario: 50, subtotal: 100 }],
            total: 100,
            monto_pagado: 0,
            estado: "pendiente",
            envases_devueltos: { bidones_20L: 0, bidones_12L: 0, sodas: 0 }
        });
        
        await Cliente.findByIdAndUpdate(testClienteId, {
            $inc: {
                "deuda.saldo": 100,
                "deuda.bidones_20L": 2
            }
        });
        
        const resultado = await registrarCobranza({
            clienteId: testClienteId,
            ticketIds: [venta._id],
            pagos: [{ ticketId: venta._id, monto: 100 }],
            envasesDevueltos: { bidones_20L: 2, bidones_12L: 0, sodas: 0 },
            metodoPago: "efectivo"
        }, testBusinessId);
        
        expect(resultado.ventas[0].estado).toBe("saldado");
        expect(resultado.ventas[0].monto_pagado).toBe(100);
        expect(resultado.ventas[0].envases_devueltos.bidones_20L).toBe(2);
    });
});
