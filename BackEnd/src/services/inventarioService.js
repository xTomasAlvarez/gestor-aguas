import Empresa from "../models/Empresa.js";
import Cliente from "../models/Cliente.js";
import mongoose from "mongoose";

// ── obtenerDashboard ───────────────────────────────────────────────────────
export const obtenerDashboard = async (businessId) => {
    const empresa = await Empresa.findById(businessId);
    if (!empresa) throw Object.assign(new Error("Empresa no encontrada."), { status: 404 });
    
    let inventario = empresa.inventario || {};
    let needsSave = false;

    // ── MIGRACIÓN EN CALIENTE NATIVA ──
    const migrationMap = {
        bidones20L: "Bidon 20L",
        bidones12L: "Bidon 12L",
        sodas: "Soda",
        dispensers: empresa.productos?.find(p => p.label?.toLowerCase().includes("dispenser"))?.key || "Dispenser"
    };

    for (const [oldKey, newKey] of Object.entries(migrationMap)) {
        if (inventario[oldKey] !== undefined) {
             inventario[newKey] = { 
                 cantidadTotal: inventario[oldKey].cantidadTotal || 0, 
                 costoReposicion: inventario[oldKey].costoReposicion || 0 
             };
             delete inventario[oldKey];
             needsSave = true;
        }
    }

    if (needsSave) {
        empresa.inventario = inventario;
        empresa.markModified('inventario'); // Obligatorio para tipos Object/Mixed en Mongoose
        await empresa.save();
    }

    // Calcular "En Calle" sumando dispensersAsignados de clientes
    const agregacionClientes = await Cliente.aggregate([
        { $match: { businessId: new mongoose.Types.ObjectId(businessId) } },
        { $group: { _id: null, dispensersEnCalle: { $sum: "$dispensersAsignados" } } }
    ]).catch(() => [{ dispensersEnCalle: 0 }]); // Fallback si businessId casting falla
    
    const dispensersEnCalle = agregacionClientes[0]?.dispensersEnCalle || 0;

    // ── LECTURA DINÁMICA DE ITEMS ──
    const dashboard = {};
    let valorizacionTotal = 0;
    
    const productosBase = empresa.productos || [];

    for (const prod of productosBase) {
        const itemStock = inventario[prod.key] || { cantidadTotal: 0, costoReposicion: 0 };
        const isDispenser = prod.label?.toLowerCase().includes("dispenser");
        const enCalle = isDispenser ? dispensersEnCalle : 0;
        const valorizacion = itemStock.cantidadTotal * itemStock.costoReposicion;

        dashboard[prod.key] = {
            label: prod.label,
            total: itemStock.cantidadTotal,
            enCalle: enCalle,
            enDeposito: Math.max(0, itemStock.cantidadTotal - enCalle),
            costoReposicion: itemStock.costoReposicion,
            valorizacion: valorizacion
        };
        valorizacionTotal += valorizacion;
    }

    // Incluir huérfanos históricos
    for (const [key, data] of Object.entries(inventario)) {
        if (!dashboard[key]) {
             const valorizacion = data.cantidadTotal * data.costoReposicion;
             dashboard[key] = {
                 label: key, 
                 total: data.cantidadTotal,
                 enCalle: 0,
                 enDeposito: data.cantidadTotal,
                 costoReposicion: data.costoReposicion,
                 valorizacion: valorizacion
             };
             valorizacionTotal += valorizacion;
        }
    }

    return { items: dashboard, valorizacionTotal };
};

// ── actualizarInventario ───────────────────────────────────────────────────
export const actualizarInventario = async (body, businessId) => {
    const empresa = await Empresa.findById(businessId);
    if (!empresa) throw Object.assign(new Error("Empresa no encontrada."), { status: 404 });

    let inventario = empresa.inventario || {};

    for (const [key, data] of Object.entries(body)) {
        if (!data || typeof data !== "object") continue;
        const current = inventario[key] || { cantidadTotal: 0, costoReposicion: 0 };
        inventario[key] = {
            cantidadTotal: data.cantidadTotal !== undefined ? data.cantidadTotal : current.cantidadTotal,
            costoReposicion: data.costoReposicion !== undefined ? data.costoReposicion : current.costoReposicion
        };
    }

    empresa.inventario = inventario;
    empresa.markModified('inventario');
    await empresa.save();

    return { message: "Inventario actualizado", inventario: empresa.inventario };
};
