//Dependencias
import mongoose from "mongoose";
import { configDotenv } from 'dotenv';
import cors from "cors";
import express from "express";
import morgan from "morgan";
//Importaciones
import { dbConect } from "../BackEnd/src/config/dbConect.js";
import ventasRoutes from "../BackEnd/src/routes/ventasRoutes.js"
import clientesRoutes from "../BackEnd/src/routes/clientesRoutes.js"
import gastosRoutes from "../BackEnd/src/routes/gastosRoutes.js"
import llenadoRoutes from "../BackEnd/src/routes/llenadoRoutes.js"


//Permite cargar las variables del .envv
configDotenv()

//Traemos los valores del .env y ponemos valores default por si fallan los otros
const {
    PORT = 3006,
    HOST = "localhost",
    DB_URI = "mongodb://localhost:27017/repartocluster"
} = process.env;

//Callback default para que se ejecute luego de levantarse el servidor
const backLog = () => console.log(`Servidor escuchando en http://${HOST}:${PORT}, con MongoDB en ${DB_URI}`);

const app = express()

app.use(express.json()) //Dependencia para que maneje json
app.use(morgan("dev")) //Dependencia que maneja logs
app.use(cors()) // Dependencia para poder conectar con Front sin bloqueos

dbConect(DB_URI); //Conexion a base de datos

//Direccionamiento a EndPoints

app.use("/api/ventas", ventasRoutes);
// app.use("/api/clientes", clientesRoutes);
// app.use("/api/llenado", llenadoRoutes);
// app.use("/api/gastos", gastosRoutes);

app.listen(PORT, HOST, backLog) //Levantamos el servidor