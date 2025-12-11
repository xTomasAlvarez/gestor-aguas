//Dependencias
import mongoose from "mongoose";
import { configDotenv } from 'dotenv';
import cors from "cors";
import express from "express";
import morgan from "morgan";
//Importaciones
import { dbConfig } from "../BackEnd/src/config/dbConfig.js";

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
app.use(morgan("dev")) //Dependencia que maneja logs

dbConfig(DB_URI); //Conexion a base de datos

app.listen(PORT, HOST, backLog) //Levantamos el servidor