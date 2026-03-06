import mongoose from "mongoose";
import logger from "./logger.js";

export const dbConect = async (DB_URI) => {
    try {
        await mongoose.connect(DB_URI);
        logger.info("✅ Conexión a MongoDB establecida correctamente.");
    } catch (error) {
        logger.error("❌ Error al conectar con MongoDB:", error.message);
        process.exit(1); // Termina el proceso si no se puede conectar
    }
};