import mongoose from "mongoose";
import Venta   from "../models/Venta.js";
import Cliente from "../models/Cliente.js";
import Cobranza from "../models/Cobranza.js";
import { construirIncDeuda, saldoPendiente, construirIncDevolucionEnvases } from "../helpers/deuda.js";

// ── crearVenta ─────────────────────────────────────────────────────────────
export const crearVenta = async (body, businessId) => {
    const { metodo_pago, items = [], cliente: clienteId, total = 0, monto_pagado = 0, fecha } = body;
    const esCobranzaPura = items.length === 0;

    if (esCobranzaPura) {
        await Cliente.findOneAndUpdate(
            { _id: clienteId, businessId },
            { $inc: { "deuda.saldo": -Math.abs(monto_pagado) } }
        );
    } else {
        if (metodo_pago === "fiado") {
            const incDeuda = construirIncDeuda(items, 1);
            await Cliente.findOneAndUpdate({ _id: clienteId, businessId }, { $inc: incDeuda });
        }
        const saldo = saldoPendiente(total, monto_pagado);
        if (saldo > 0) {
            await Cliente.findOneAndUpdate({ _id: clienteId, businessId }, { $inc: { "deuda.saldo": saldo } });
        }
    }

    const payload = { ...body, businessId };
    if (fecha) payload.fecha = new Date(fecha);

    return await Venta.create(payload);
};

// ── obtenerVentas ──────────────────────────────────────────────────────────
export const obtenerVentas = async (businessId, fechaStr) => {
    let filtroVentas = { businessId };

    if (fechaStr) {
        // Filtrar por dia específico (inicio a fin del dia en UTC o ISO)
        // Se asume fechaStr = "YYYY-MM-DD"
        const inicio = new Date(`${fechaStr}T00:00:00.000Z`);
        const fin = new Date(`${fechaStr}T23:59:59.999Z`);
        filtroVentas.fecha = { $gte: inicio, $lte: fin };
    }

    const ventas = await Venta.find(filtroVentas)
        .populate("cliente", "nombre direccion")
        .sort({ fecha: -1 });

    if (fechaStr) {
        const inicio = new Date(`${fechaStr}T00:00:00.000Z`);
        const fin = new Date(`${fechaStr}T23:59:59.999Z`);
        const cobranzasExtra = await Cobranza.find({
            businessId,
            fecha: { $gte: inicio, $lte: fin }
        })
        .populate("cliente", "nombre direccion")
        .populate("venta", "fecha")
        .sort({ fecha: -1 });

        return { ventas, cobranzasExtra };
    }

    return ventas;
};

// ── obtenerVentaPorId ──────────────────────────────────────────────────────
export const obtenerVentaPorId = async (ventaId, businessId) => {
    const venta = await Venta.findOne({ _id: ventaId, businessId })
        .populate("cliente", "nombre direccion");
        
    if (!venta) {
        const err = new Error("Venta no encontrada.");
        err.status = 404;
        throw err;
    }
    
    return venta;
};

// ── actualizarVenta ────────────────────────────────────────────────────────
export const actualizarVenta = async (ventaId, body, businessId) => {
    const ventaOriginal = await Venta.findOne({ _id: ventaId, businessId });
    if (!ventaOriginal) {
        const err = new Error("Venta no encontrada.");
        err.status = 404;
        throw err;
    }

    const esCobranzaOriginal = ventaOriginal.items.length === 0;

    // Paso 1: Revertir deuda ORIGINAL
    if (esCobranzaOriginal) {
        await Cliente.findByIdAndUpdate(ventaOriginal.cliente, {
            $inc: { "deuda.saldo": Math.abs(ventaOriginal.monto_pagado || 0) },
        });
    } else {
        if (ventaOriginal.metodo_pago === "fiado") {
            const incReversion = construirIncDeuda(ventaOriginal.items, -1);
            await Cliente.findByIdAndUpdate(ventaOriginal.cliente, { $inc: incReversion });
        }
        const saldoOrig = saldoPendiente(ventaOriginal.total, ventaOriginal.monto_pagado);
        if (saldoOrig > 0) {
            await Cliente.findByIdAndUpdate(ventaOriginal.cliente, { $inc: { "deuda.saldo": -saldoOrig } });
        }
    }

    // Paso 2: Aplicar deuda NUEVA
    const { metodo_pago: nuevoMetodo, items: nuevosItems = [], cliente: nuevoClienteId, total: nuevoTotal = 0, monto_pagado: nuevoPagado = 0 } = body;
    const clienteTarget   = nuevoClienteId || ventaOriginal.cliente;
    const esCobranzaNueva = nuevosItems.length === 0;

    if (esCobranzaNueva) {
        await Cliente.findByIdAndUpdate(clienteTarget, {
            $inc: { "deuda.saldo": -Math.abs(nuevoPagado) },
        });
    } else {
        if (nuevoMetodo === "fiado") {
            const incNueva = construirIncDeuda(nuevosItems, 1);
            await Cliente.findByIdAndUpdate(clienteTarget, { $inc: incNueva });
        }
        const nuevoSaldo = saldoPendiente(nuevoTotal, nuevoPagado);
        if (nuevoSaldo > 0) {
            await Cliente.findByIdAndUpdate(clienteTarget, { $inc: { "deuda.saldo": nuevoSaldo } });
        }
    }

    // Paso 3: Guardar venta actualizada
    const ventaActualizada = await Venta.findByIdAndUpdate(
        ventaId, body,
        { new: true, runValidators: true }
    );
    
    return ventaActualizada;
};

// ── eliminarVenta ──────────────────────────────────────────────────────────
export const eliminarVenta = async (ventaId, businessId) => {
    const venta = await Venta.findOne({ _id: ventaId, businessId });
    if (!venta) {
        const err = new Error("Venta no encontrada.");
        err.status = 404;
        throw err;
    }

    const esCobranza = venta.items.length === 0;

    if (esCobranza) {
        await Cliente.findByIdAndUpdate(venta.cliente, {
            $inc: { "deuda.saldo": Math.abs(venta.monto_pagado || 0) },
        });
    } else {
        if (venta.metodo_pago === "fiado") {
            const incReversion = construirIncDeuda(venta.items, -1);
            await Cliente.findByIdAndUpdate(venta.cliente, { $inc: incReversion });
        }
        const saldo = saldoPendiente(venta.total, venta.monto_pagado);
        if (saldo > 0) {
            await Cliente.findByIdAndUpdate(venta.cliente, { $inc: { "deuda.saldo": -saldo } });
        }
    }

    await Venta.findByIdAndDelete(ventaId);
    return { message: "Registro eliminado y deuda revertida correctamente." };
};

// ── registrarCobranza ──────────────────────────────────────────────────────
// Soporta tanto pagos de un único ticket (backward compatibility) como múltiples tickets
// body.ticketIds: array de IDs (nuevo)
// body.pagos: array de { ticketId, monto } (nuevo)
// body.ticketId: string (legacy, para backward compatibility)
// body.montoAbonado: number (legacy, para backward compatibility)
export const registrarCobranza = async (body, businessId) => {
    // Detectar si estamos en testing (MongoDB in-memory sin soporte para transacciones)
    const isTestEnv = process.env.NODE_ENV === "test" || process.env.TESTING === "true";
    const session = isTestEnv ? null : await mongoose.startSession();
    
    let transactionStarted = false;
    if (session) {
        try {
            session.startTransaction();
            transactionStarted = true;
        } catch (err) {
            // En algunos MongoDB in-memory, startTransaction falla
        }
    }
    
    try {
        const {
            clienteId,
            ticketIds = [],
            ticketId,           // Legacy
            pagos = [],         // Nuevo: array de { ticketId, monto }
            montoAbonado = 0,   // Legacy
            envasesDevueltos = {},
            metodoPago = "efectivo"
        } = body;

        // Backward compatibility: si viene ticketId (legacy), convertir a ticketIds
        const idsAVerificar = ticketIds.length > 0 ? ticketIds : (ticketId ? [ticketId] : []);
        
        if (idsAVerificar.length === 0) {
            throw new Error("Debes proporcionar al menos un ticket (ticketIds o ticketId).");
        }

        // Paso 1: Obtener todas las ventas
        const query = Venta.find({
            _id: { $in: idsAVerificar },
            businessId,
            cliente: clienteId
        });
        const ventas = session ? await query.session(session).sort({ fecha: 1 }) : await query.sort({ fecha: 1 });

        if (ventas.length !== idsAVerificar.length) {
            throw new Error("Uno o más tickets no existen o no pertenecen a este cliente.");
        }

        // Paso 2: Validar que ninguno esté ya saldado
        const ventasSaldadas = ventas.filter(v => v.estado === "saldado");
        if (ventasSaldadas.length > 0) {
            throw new Error("Uno o más tickets ya se encuentran totalmente saldados.");
        }

        let pagoMap = new Map();
        
        if (pagos.length > 0) {
            // Nueva API: usar array de pagos explícitos
            pagos.forEach(p => {
                pagoMap.set(String(p.ticketId), p.monto || 0);
            });
        } else if (montoAbonado > 0 && ticketId) {
            // Legacy API: usar montoAbonado estrictamente para el ticketId único enviado
            pagoMap.set(String(ticketId), montoAbonado);
        }

        // Paso 4: Validar totales
        const deudaTotal = ventas.reduce((sum, venta) => {
            const deuda = Math.max(0, venta.total - (venta.monto_pagado || 0));
            return sum + deuda;
        }, 0);

        const totalPagado = Array.from(pagoMap.values()).reduce((a, b) => a + b, 0);
        
        if (totalPagado > deudaTotal) {
            throw new Error(`Suma de pagos ($${totalPagado}) excede deuda total ($${deudaTotal}).`);
        }

        // Paso 5: Procesar cada venta con su pago
        const ventasActualizadas = [];
        const cobranzasParaCrear = [];
        let envasesRestantes = {
            bidones_20L: envasesDevueltos.bidones_20L || 0,
            bidones_12L: envasesDevueltos.bidones_12L || 0,
            sodas: envasesDevueltos.sodas || 0
        };

        for (const venta of ventas) {
            const montoPago = pagoMap.get(String(venta._id)) || 0;

            // Calcular prestados en este ticket
            const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            for (const item of venta.items) {
                if (item.producto === "Bidon 20L") prestados.bidones_20L += item.cantidad;
                if (item.producto === "Bidon 12L") prestados.bidones_12L += item.cantidad;
                if (item.producto === "Soda") prestados.sodas += item.cantidad;
            }

            // Validar monto pago para este ticket
            const deudaRestante = Math.max(0, venta.total - (venta.monto_pagado || 0));
            if (montoPago > deudaRestante) {
                throw new Error(`Monto de pago para ticket ${venta._id} ($${montoPago}) excede su deuda ($${deudaRestante}).`);
            }

            // Actualizar monto_pagado
            venta.monto_pagado += montoPago;

            // Paso 6: Procesar devolución de envases (FIFO: este ticket primero)
            if (!venta.envases_devueltos) {
                venta.envases_devueltos = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            }

            // Calcular pendientes en este ticket
            const pendientes = {
                bidones_20L: prestados.bidones_20L - (venta.envases_devueltos.bidones_20L || 0),
                bidones_12L: prestados.bidones_12L - (venta.envases_devueltos.bidones_12L || 0),
                sodas: prestados.sodas - (venta.envases_devueltos.sodas || 0)
            };

            // Deducir envases de este ticket (FIFO)
            const aDeducir = {
                bidones_20L: Math.min(envasesRestantes.bidones_20L, pendientes.bidones_20L),
                bidones_12L: Math.min(envasesRestantes.bidones_12L, pendientes.bidones_12L),
                sodas: Math.min(envasesRestantes.sodas, pendientes.sodas)
            };

            venta.envases_devueltos.bidones_20L += aDeducir.bidones_20L;
            venta.envases_devueltos.bidones_12L += aDeducir.bidones_12L;
            venta.envases_devueltos.sodas += aDeducir.sodas;

            // Restar de envases globales
            envasesRestantes.bidones_20L -= aDeducir.bidones_20L;
            envasesRestantes.bidones_12L -= aDeducir.bidones_12L;
            envasesRestantes.sodas -= aDeducir.sodas;

            // Determinar estado estrictamente por pago monetario
            const pagoCompleto = (venta.monto_pagado === venta.total);

            if (pagoCompleto) {
                venta.estado = "saldado";
            } else if (venta.monto_pagado > 0) {
                venta.estado = "pago_parcial";
            } else {
                venta.estado = "pendiente";
            }

            const saveOpts = session ? { session } : {};
            await venta.save(saveOpts);
            ventasActualizadas.push(venta);

            // Encolar Cobranza si hay pago
            if (montoPago > 0) {
                cobranzasParaCrear.push({
                    venta: venta._id,
                    cliente: clienteId,
                    monto: montoPago,
                    metodoPago: metodoPago,
                    businessId: businessId
                });
            }
        }

        // Paso 7: Crear todas las Cobranzas
        if (cobranzasParaCrear.length > 0) {
            const insertOpts = session ? { session } : {};
            await Cobranza.insertMany(cobranzasParaCrear, insertOpts);
        }

        // Paso 8: Validar envases devueltos globales (no exceder total prestado)
        const totalEnvasesDevueltos = {
            bidones_20L: envasesDevueltos.bidones_20L || 0,
            bidones_12L: envasesDevueltos.bidones_12L || 0,
            sodas: envasesDevueltos.sodas || 0
        };

        const totalEnvasesPrestados = ventas.reduce((acc, venta) => {
            const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
            for (const item of venta.items) {
                if (item.producto === "Bidon 20L") prestados.bidones_20L += item.cantidad;
                if (item.producto === "Bidon 12L") prestados.bidones_12L += item.cantidad;
                if (item.producto === "Soda") prestados.sodas += item.cantidad;
            }
            return {
                bidones_20L: acc.bidones_20L + prestados.bidones_20L,
                bidones_12L: acc.bidones_12L + prestados.bidones_12L,
                sodas: acc.sodas + prestados.sodas
            };
        }, { bidones_20L: 0, bidones_12L: 0, sodas: 0 });

        const totalDevueltosAhora = ventas.reduce((acc, venta) => {
            return {
                bidones_20L: acc.bidones_20L + (venta.envases_devueltos?.bidones_20L || 0),
                bidones_12L: acc.bidones_12L + (venta.envases_devueltos?.bidones_12L || 0),
                sodas: acc.sodas + (venta.envases_devueltos?.sodas || 0)
            };
        }, { bidones_20L: 0, bidones_12L: 0, sodas: 0 });

        if (totalDevueltosAhora.bidones_20L > totalEnvasesPrestados.bidones_20L) {
            throw new Error(`Se intentan devolver más bidones de 20L de los prestados en total.`);
        }
        if (totalDevueltosAhora.bidones_12L > totalEnvasesPrestados.bidones_12L) {
            throw new Error(`Se intentan devolver más bidones de 12L de los prestados en total.`);
        }
        if (totalDevueltosAhora.sodas > totalEnvasesPrestados.sodas) {
            throw new Error(`Se intentan devolver más sodas de las prestadas en total.`);
        }

        // Paso 9: Actualizar cliente ONCE
        const incCliente = construirIncDevolucionEnvases(totalEnvasesDevueltos);
        if (totalPagado > 0) {
            incCliente["deuda.saldo"] = -Math.abs(totalPagado);
        }

        if (Object.keys(incCliente).length > 0) {
            const updateOpts = session ? { session } : {};
            await Cliente.findByIdAndUpdate(clienteId, { $inc: incCliente }, updateOpts);
        }

        // Paso 10: Commit (solo si la transacción fue iniciada)
        if (transactionStarted) {
            await session.commitTransaction();
        }
        return { message: "Liquidación registrada exitosamente.", ventas: ventasActualizadas };

    } catch (error) {
        if (transactionStarted) {
            await session.abortTransaction();
        }
        const err = new Error(error.message || "Error al procesar la cobranza múltiple.");
        err.status = 400;
        throw err;
     } finally {
         if (session) {
             session.endSession();
         }
     }
};
