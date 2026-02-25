import api from "./api.js";

const BASE = "/clientes";

// ── Obtener todos los clientes activos (acepta ?nombre= para filtrar) ──────
export const obtenerClientes = (nombre = "") => {
    const params = nombre ? { nombre } : {};
    return api.get(BASE, { params });
};

// ── Obtener un cliente por ID ──────────────────────────────────────────────
export const obtenerClientePorId = (id) => api.get(`${BASE}/${id}`);

// ── Crear un nuevo cliente ─────────────────────────────────────────────────
export const crearCliente = (datos) => api.post(BASE, datos);

// ── Actualizar datos de un cliente ────────────────────────────────────────
export const actualizarCliente = (id, datos) => api.put(`${BASE}/${id}`, datos);

// ── Soft-delete: desactivar un cliente ────────────────────────────────────
export const eliminarCliente = (id) => api.delete(`${BASE}/${id}`);
