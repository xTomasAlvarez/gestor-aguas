import app from './app.js';
import { dbConect } from "./src/config/dbConect.js";
import logger from "./src/config/logger.js";

const PORT   = process.env.PORT   || 3005;
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/reparto_db";

dbConect(DB_URI);

process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", { reason });
});

app.listen(PORT, () => {
    logger.info(`Servidor corriendo en el puerto ${PORT}`);
});