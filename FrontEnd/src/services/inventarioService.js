import api from "./api";

// Obtener los datos del inventario (Global vs Calle) y la valorización
export const obtenerDashboardInventario = () => api.get("/inventario/dashboard");

// Actualizar cantidad total o costo de un item
export const actualizarStock = (payload) => api.patch("/inventario", payload);
