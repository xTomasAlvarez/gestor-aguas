import { crearCrudService } from "./crudService.js";

const crud = crearCrudService("/llenados");

export const obtenerLlenados   = crud.obtener;
export const crearLlenado      = crud.crear;
export const actualizarLlenado = crud.actualizar;
export const eliminarLlenado   = crud.eliminar;
