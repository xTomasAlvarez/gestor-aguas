// ── Dependencias externas ──────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import rateLimit from "express-rate-limit";

// ── Importaciones internas ─────────────────────────────────────────────────
import { dbConect } from "./src/config/dbConect.js";
import authRoutes    from "./src/routes/authRoutes.js";
import clientesRoutes from "./src/routes/clientesRoutes.js";
import ventasRoutes   from "./src/routes/ventasRoutes.js";
import gastosRoutes   from "./src/routes/gastosRoutes.js";
import llenadoRoutes  from "./src/routes/llenadoRoutes.js";
import statsRoutes    from "./src/routes/statsRoutes.js";
import adminRoutes    from "./src/routes/adminRoutes.js";
import superAdminRoutes from "./src/routes/superAdminRoutes.js";
import configRoutes   from "./src/routes/configRoutes.js";
import inventarioRoutes from "./src/routes/inventarioRoutes.js";
import { proteger }   from "./src/middleware/authMiddleware.js";
import { checkStatus } from "./src/middleware/checkStatus.js";
import { soloSuperAdmin } from "./src/middleware/superAdminMiddleware.js";

// ── Variables de entorno ───────────────────────────────────────────────────
const PORT   = process.env.PORT   || 3005;
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/reparto_db";

// ── Inicialización de Express ──────────────────────────────────────────────
const app = express();

// ── Middlewares globales de Ciberseguridad ──────────────────────────────────
app.use(helmet()); // Añade cabeceras HTTP seguras (anti-XSS, anti-Clickjacking)

// Sanitización agresiva contra Inyecciones NoSQL (elimina $ y .)
app.use(mongoSanitize());
app.use(express.json({ limit: "1mb" })); // Límite de payload

// Limitador de Tráfico Global (DDoS Básico)
const limiterGlobal = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por IP cada 15 min
    message: { message: "Demasiadas peticiones desde esta IP. Inténtalo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiterGlobal);

app.use(morgan("dev"));

// Configuración estricta de CORS
const dominiosPermitidos = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(",") : [];
app.use(cors({
    origin: function (origin, callback) {
        // Permitir peticiones sin origen (como Postman) o si el origen está en la lista blanca
        if (!origin || dominiosPermitidos.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            callback(new Error("Acceso bloqueado por políticas de CORS"));
        }
    },
    credentials: true,
}));

// ── Conexión a la Base de Datos ────────────────────────────────────────────
dbConect(DB_URI);

// ── Rutas de la API ──────────────────────────────────────────────
app.use("/api/auth",     authRoutes);                             // pública

// Middleware global: autenticación + check de suspensión para todas las rutas protegidas
app.use("/api/clientes",  proteger, checkStatus, clientesRoutes);
app.use("/api/ventas",    proteger, checkStatus, ventasRoutes);
app.use("/api/gastos",    proteger, checkStatus, gastosRoutes);
app.use("/api/llenados",  proteger, checkStatus, llenadoRoutes);
app.use("/api/stats",     proteger, checkStatus, statsRoutes);
app.use("/api/admin",     proteger, checkStatus, adminRoutes);
app.use("/api/config",    proteger, checkStatus, configRoutes);
app.use("/api/inventario", proteger, checkStatus, inventarioRoutes);
app.use("/api/superadmin", proteger, soloSuperAdmin, superAdminRoutes);

// ── Arranque del servidor ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});