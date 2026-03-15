import * as VentasService from "../services/ventasService.js";

const biz = (req) => req.usuario.businessId;

// ── POST /api/ventas ───────────────────────────────────────────────────────
export const crearVenta = async (req, res) => {
    try {
        const resultado = await VentasService.crearVenta(req.body, biz(req));
        res.status(201).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/ventas ────────────────────────────────────────────────────────
export const obtenerVentas = async (req, res) => {
    try {
        const { fecha } = req.query;
        const resultado = await VentasService.obtenerVentas(biz(req), fecha);
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── GET /api/ventas/:id ────────────────────────────────────────────────────
export const obtenerVentaPorId = async (req, res) => {
    try {
        const resultado = await VentasService.obtenerVentaPorId(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── PUT /api/ventas/:id ────────────────────────────────────────────────────
export const actualizarVenta = async (req, res) => {
    try {
        const resultado = await VentasService.actualizarVenta(req.params.id, req.body, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── DELETE /api/ventas/:id ─────────────────────────────────────────────────
export const eliminarVenta = async (req, res) => {
    try {
        const resultado = await VentasService.eliminarVenta(req.params.id, biz(req));
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 500).json({ message: error.message });
    }
};

// ── POST /api/ventas/cobrar (Liquidación de Ticket) ────────────────────────
export const registrarCobranza = async (req, res) => {
    try {
        const resultado = await VentasService.registrarCobranza(
            req.body,
            biz(req)
        );
        res.status(200).json(resultado);
    } catch (error) {
        res.status(error.status || 400).json({ message: error.message });
    }
};
