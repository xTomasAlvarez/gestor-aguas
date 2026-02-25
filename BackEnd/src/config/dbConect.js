import mongoose from "mongoose";

export const dbConect = async (DB_URI) => {
    try {
        await mongoose.connect(DB_URI);
        console.log("✅ Conexión a MongoDB establecida correctamente.");
    } catch (error) {
        console.error("❌ Error al conectar con MongoDB:", error.message);
        process.exit(1); // Termina el proceso si no se puede conectar
    }
};