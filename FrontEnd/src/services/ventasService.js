import { crearCrudService } from "./crudService.js";


const BASE  = "/ventas";
const crud  = crearCrudService(BASE);

export const obtenerVentas   = crud.obtener;
export const crearVenta      = crud.crear;
export const actualizarVenta = crud.actualizar;
export const anularVenta     = crud.eliminar;
