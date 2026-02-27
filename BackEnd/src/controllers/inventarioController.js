import Empresa from "../models/Empresa.js";
import Cliente from "../models/Cliente.js";

const biz = (req) => req.usuario.businessId;

// ── GET /api/inventario/dashboard ──────────────────────────────────────────
export const obtenerDashboard = async (req, res) => {
    try {
        const businessId = biz(req);
        
        // Obtener inventario de la empresa
        const empresa = await Empresa.findById(businessId).lean();
        if (!empresa) return res.status(404).json({ message: "Empresa no encontrada." });
        
        const inventario = empresa.inventario || {
            bidones20L: { cantidadTotal: 0, costoReposicion: 0 },
            bidones12L: { cantidadTotal: 0, costoReposicion: 0 },
            sodas:      { cantidadTotal: 0, costoReposicion: 0 },
            dispensers: { cantidadTotal: 0, costoReposicion: 0 }
        };

        // Calcular "En Calle" sumando dispensersAsignados de clientes
        const agregacionClientes = await Cliente.aggregate([
            { $match: { businessId } },
            { $group: {
                _id: null,
                dispensersEnCalle: { $sum: "$dispensersAsignados" }
            }}
        ]);
        
        const dispensersEnCalle = agregacionClientes[0]?.dispensersEnCalle || 0;

        // Construir la respuesta
        // bidones20L, bidones12L, sodas asumen 100% en depósito al no rastrear comodatos de envases aún
        const dashboard = {
            bidones20L: {
                total: inventario.bidones20L.cantidadTotal,
                enCalle: 0,
                enDeposito: inventario.bidones20L.cantidadTotal,
                costoReposicion: inventario.bidones20L.costoReposicion,
                valorizacion: inventario.bidones20L.cantidadTotal * inventario.bidones20L.costoReposicion
            },
            bidones12L: {
                total: inventario.bidones12L.cantidadTotal,
                enCalle: 0,
                enDeposito: inventario.bidones12L.cantidadTotal,
                costoReposicion: inventario.bidones12L.costoReposicion,
                valorizacion: inventario.bidones12L.cantidadTotal * inventario.bidones12L.costoReposicion
            },
            sodas: {
                total: inventario.sodas.cantidadTotal,
                enCalle: 0,
                enDeposito: inventario.sodas.cantidadTotal,
                costoReposicion: inventario.sodas.costoReposicion,
                valorizacion: inventario.sodas.cantidadTotal * inventario.sodas.costoReposicion
            },
            dispensers: {
                total: inventario.dispensers.cantidadTotal,
                enCalle: dispensersEnCalle,
                enDeposito: Math.max(0, inventario.dispensers.cantidadTotal - dispensersEnCalle),
                costoReposicion: inventario.dispensers.costoReposicion,
                valorizacion: inventario.dispensers.cantidadTotal * inventario.dispensers.costoReposicion
            }
        };

        const valorizacionTotal = 
            dashboard.bidones20L.valorizacion + 
            dashboard.bidones12L.valorizacion + 
            dashboard.sodas.valorizacion + 
            dashboard.dispensers.valorizacion;

        res.status(200).json({ items: dashboard, valorizacionTotal });
    } catch (error) {
        res.status(500).json({ message: "Error al obtener dashboard de inventario.", error: error.message });
    }
};

// ── PATCH /api/inventario ──────────────────────────────────────────────────
export const actualizarInventario = async (req, res) => {
    try {
        const businessId = biz(req);
        const bod = req.body; 
        
        // Cargar los campos existentes antes de pisar
        const empresa = await Empresa.findById(businessId).lean();
        if (!empresa) return res.status(404).json({ message: "Empresa no encontrada." });

        const inv = empresa.inventario || {};

        const buildUpdate = (key, data) => {
            if (!data) return inv[key] || { cantidadTotal: 0, costoReposicion: 0 };
            return {
                cantidadTotal: data.cantidadTotal !== undefined ? data.cantidadTotal : (inv[key]?.cantidadTotal || 0),
                costoReposicion: data.costoReposicion !== undefined ? data.costoReposicion : (inv[key]?.costoReposicion || 0)
            };
        };

        const update = {
            "inventario.bidones20L": buildUpdate("bidones20L", bod.bidones20L),
            "inventario.bidones12L": buildUpdate("bidones12L", bod.bidones12L),
            "inventario.sodas":      buildUpdate("sodas", bod.sodas),
            "inventario.dispensers": buildUpdate("dispensers", bod.dispensers),
        };

        const empresaActualizada = await Empresa.findByIdAndUpdate(
            businessId,
            { $set: update },
            { new: true, runValidators: true }
        ).lean();

        res.status(200).json({ message: "Inventario actualizado", inventario: empresaActualizada.inventario });

    } catch (error) {
        res.status(500).json({ message: "Error al actualizar inventario.", error: error.message });
    }
};
