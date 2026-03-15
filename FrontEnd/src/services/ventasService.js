import api from "./api.js";
import { crearCrudService } from "./crudService.js";


const BASE  = "/ventas";
const crud  = crearCrudService(BASE);

export const obtenerVentas = async (fecha) => {
    let url = BASE;
    if (fecha) url += `?fecha=${fecha}`;
    return await api.get(url);
};
export const crearVenta      = crud.crear;
export const actualizarVenta = crud.actualizar;
export const anularVenta     = crud.eliminar;

export const registrarCobranza = async (data) => {
    const res = await api.post(`${BASE}/cobrar`, data);
    return res.data;
};
