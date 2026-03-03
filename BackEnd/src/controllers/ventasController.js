import mongoose from "mongoose";
import Venta   from "../models/Venta.js";
import Cliente from "../models/Cliente.js";
import { construirIncDeuda, saldoPendiente, construirIncDevolucionEnvases } from "../helpers/deuda.js";

const biz = (req) => req.usuario.businessId;

// ── POST /api/ventas ───────────────────────────────────────────────────────
export const crearVenta = async (req, res) => {
    try {
        const businessId = biz(req);
        const { metodo_pago, items = [], cliente: clienteId, total = 0, monto_pagado = 0, fecha } = req.body;
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

        const payload = { ...req.body, businessId };
        if (fecha) payload.fecha = new Date(fecha);

        const nuevaVenta = await Venta.create(payload);
        res.status(201).json(nuevaVenta);
    } catch (error) {
        console.error("[crearVenta]", error);
        res.status(500).json({ message: "Error al crear la venta.", error: error.message });
    }
};

// ── GET /api/ventas ────────────────────────────────────────────────────────
export const obtenerVentas = async (req, res) => {
    try {
        const ventas = await Venta.find({ businessId: biz(req) })
            .populate("cliente", "nombre direccion")
            .sort({ fecha: -1 });
        res.status(200).json(ventas);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener las ventas.", error: error.message });
    }
};

// ── GET /api/ventas/:id ────────────────────────────────────────────────────
export const obtenerVentaPorId = async (req, res) => {
    try {
        const venta = await Venta.findOne({ _id: req.params.id, businessId: biz(req) })
            .populate("cliente", "nombre direccion");
        if (!venta) return res.status(404).json({ message: "Venta no encontrada." });
        res.status(200).json(venta);
    } catch (error) {
        res.status(500).json({ message: "Error al obtener la venta.", error: error.message });
    }
};

// ── PUT /api/ventas/:id ────────────────────────────────────────────────────
export const actualizarVenta = async (req, res) => {
    try {
        const businessId = biz(req);
        const ventaOriginal = await Venta.findOne({ _id: req.params.id, businessId });
        if (!ventaOriginal) return res.status(404).json({ message: "Venta no encontrada." });

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
        const { metodo_pago: nuevoMetodo, items: nuevosItems = [], cliente: nuevoClienteId, total: nuevoTotal = 0, monto_pagado: nuevoPagado = 0 } = req.body;
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
            req.params.id, req.body,
            { new: true, runValidators: true }
        );
        res.status(200).json(ventaActualizada);
    } catch (error) {
        console.error("[actualizarVenta]", error);
        res.status(500).json({ message: "Error al actualizar la venta.", error: error.message });
    }
};

// ── DELETE /api/ventas/:id ─────────────────────────────────────────────────
export const eliminarVenta = async (req, res) => {
    try {
        const businessId = biz(req);
        const venta = await Venta.findOne({ _id: req.params.id, businessId });
        if (!venta) return res.status(404).json({ message: "Venta no encontrada." });

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

        await Venta.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Registro eliminado y deuda revertida correctamente." });
    } catch (error) {
        console.error("[eliminarVenta]", error);
        res.status(500).json({ message: "Error al eliminar.", error: error.message });
    }
};

// ── POST /api/ventas/cobrar (Liquidación de Ticket) ────────────────────────
export const registrarCobranza = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const businessId = biz(req);
        const { clienteId, ticketId, montoAbonado = 0, envasesDevueltos = {} } = req.body;

        const venta = await Venta.findOne({ _id: ticketId, businessId, cliente: clienteId }).session(session);
        if (!venta) throw new Error("Ticket no encontrado.");
        if (venta.estado === "saldado") throw new Error("Esta venta ya se encuentra totalmente saldada.");

        // Calcular lo prestado originalmente en este ticket
        const prestados = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        for (const item of venta.items) {
            if (item.producto === "Bidon 20L") prestados.bidones_20L += item.cantidad;
            if (item.producto === "Bidon 12L") prestados.bidones_12L += item.cantidad;
            if (item.producto === "Soda")      prestados.sodas       += item.cantidad;
        }

        // Validar topes
        const deudaRestanteMonetaria = saldoPendiente(venta.total, venta.monto_pagado);
        if (montoAbonado > deudaRestanteMonetaria) {
            throw new Error(`El monto abonado excede la deuda actual del ticket ($${deudaRestanteMonetaria}).`);
        }

        const devueltosAntes = venta.envases_devueltos || { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        const reqEnvases = {
            bidones_20L: envasesDevueltos.bidones_20L || 0,
            bidones_12L: envasesDevueltos.bidones_12L || 0,
            sodas:       envasesDevueltos.sodas || 0
        };

        if (devueltosAntes.bidones_20L + reqEnvases.bidones_20L > prestados.bidones_20L) throw new Error("Se intentan devolver más bidones de 20L de los prestados en el ticket.");
        if (devueltosAntes.bidones_12L + reqEnvases.bidones_12L > prestados.bidones_12L) throw new Error("Se intentan devolver más bidones de 12L de los prestados en el ticket.");
        if (devueltosAntes.sodas + reqEnvases.sodas > prestados.sodas) throw new Error("Se intentan devolver más sodas de las prestadas en el ticket.");

        // Aplicar actualizaciones al Ticket
        venta.monto_pagado += montoAbonado;
        if (!venta.envases_devueltos) venta.envases_devueltos = { bidones_20L: 0, bidones_12L: 0, sodas: 0 };
        venta.envases_devueltos.bidones_20L += reqEnvases.bidones_20L;
        venta.envases_devueltos.bidones_12L += reqEnvases.bidones_12L;
        venta.envases_devueltos.sodas       += reqEnvases.sodas;

        // Determinar estado
        const pagoCompleto = (venta.monto_pagado === venta.total);
        const envases20Completos = (venta.envases_devueltos.bidones_20L === prestados.bidones_20L);
        const envases12Completos = (venta.envases_devueltos.bidones_12L === prestados.bidones_12L);
        const sodasCompletas     = (venta.envases_devueltos.sodas === prestados.sodas);

        if (pagoCompleto && envases20Completos && envases12Completos && sodasCompletas) {
            venta.estado = "saldado";
        } else {
            venta.estado = "pago_parcial";
        }
        await venta.save({ session });

        // Actualizar saldo global del cliente
        const incCliente = construirIncDevolucionEnvases(reqEnvases);
        if (montoAbonado > 0) {
            incCliente["deuda.saldo"] = -Math.abs(montoAbonado);
        }

        if (Object.keys(incCliente).length > 0) {
            await Cliente.findByIdAndUpdate(clienteId, { $inc: incCliente }, { session });
        }

        await session.commitTransaction();
        res.status(200).json({ message: "Cobranza registrada exitosamente.", venta });
    } catch (error) {
        await session.abortTransaction();
        console.error("[registrarCobranza]", error);
        res.status(400).json({ message: error.message || "Error al procesar la cobranza." });
    } finally {
        session.endSession();
    }
};