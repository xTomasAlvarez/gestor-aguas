import { crearCrudService } from "./crudService.js";

const crud = crearCrudService("/gastos");

export const obtenerGastos   = crud.obtener;
export const crearGasto      = crud.crear;
export const actualizarGasto = crud.actualizar;
export const eliminarGasto   = crud.eliminar;
