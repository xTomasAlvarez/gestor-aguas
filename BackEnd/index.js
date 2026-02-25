// ── Dependencias externas ──────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

// ── Importaciones internas ─────────────────────────────────────────────────
import { dbConect } from "./src/config/dbConect.js";
import authRoutes    from "./src/routes/authRoutes.js";
import clientesRoutes from "./src/routes/clientesRoutes.js";
import ventasRoutes   from "./src/routes/ventasRoutes.js";
import gastosRoutes   from "./src/routes/gastosRoutes.js";
import llenadoRoutes  from "./src/routes/llenadoRoutes.js";
import statsRoutes    from "./src/routes/statsRoutes.js";

// ── Variables de entorno (con valores por defecto seguros) ─────────────────
const {
    PROTOCOL = "http",
    HOST     = "localhost",
    PORT     = 3005,
    DB_URI   = "mongodb://localhost:27017/reparto_db",
} = process.env;

// ── Inicialización de Express ──────────────────────────────────────────────
const app = express();

// ── Middlewares globales ───────────────────────────────────────────────────
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());

// ── Conexión a la Base de Datos ────────────────────────────────────────────
dbConect(DB_URI);

// ── Rutas de la API ────────────────────────────────────────────────────────
app.use("/api/auth",     authRoutes);      // pública
app.use("/api/clientes", clientesRoutes);
app.use("/api/ventas",   ventasRoutes);
app.use("/api/gastos",    gastosRoutes);
app.use("/api/llenados",  llenadoRoutes);
app.use("/api/stats",     statsRoutes);

// ── Arranque del servidor ──────────────────────────────────────────────────
app.listen(PORT, HOST, () => {
    console.log(`🚀 Servidor corriendo en ${PROTOCOL}://${HOST}:${PORT}`);
});