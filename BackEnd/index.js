// ── Dependencias externas ──────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import mongoSanitize from "express-mongo-sanitize";

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
import logger from "./src/config/logger.js";

// ── Variables de entorno ───────────────────────────────────────────────────
const PORT   = process.env.PORT   || 3005;
const DB_URI = process.env.DB_URI || "mongodb://localhost:27017/reparto_db";

// ── Inicialización de Express ──────────────────────────────────────────────
const app = express();

// ── 1. Configuración Dinámica y Crítica de CORS ───────────────────────────
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL, // La URL principal (producción o el localhost de tu .env)
            "http://localhost:5173",  // Vite por defecto
            "http://127.0.0.1:5173"   // Alternativa local
        ];

        // Permitir requests sin origin (como Postman o el mismo servidor) o si el origin está en la lista
        if (!origin || allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== "production") {
            callback(null, true);
        } else {
            logger.warn(`CORS bloqueado para origen: ${origin}`); // Log estricto para debugging
            callback(new Error("Acceso bloqueado por políticas de CORS"));
        }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"]
};

// Debe ser el PRIMER middleware en inyectarse para asegurar resolución de cabeceras
app.use(cors(corsOptions));

// Forzar HTTPS en producción (Render no redirige automáticamente)
if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// ── Middlewares globales de Ciberseguridad ──────────────────────────────────
app.use(helmet()); // Añade cabeceras HTTP seguras (anti-XSS, anti-Clickjacking)

// Parseo de JSON debe ir ANTES de sanitizar el body
app.use(express.json({ limit: "1mb" })); // Límite de payload

// Sanitización contra Inyecciones NoSQL
app.use(mongoSanitize());

// Limitador de Tráfico Global (DDoS Básico)
const limiterGlobal = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100, // Límite de 100 requests por IP cada 15 min
    message: { message: "Demasiadas peticiones desde esta IP. Inténtalo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiterGlobal);

// ── 3. Otros Middlewares Globales ──────────────────────────────────────────
// HTTP request logging
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) }
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

// Captura de errores no manejados
process.on("uncaughtException", (err) => {
    logger.error("uncaughtException", { error: err.message, stack: err.stack });
    process.exit(1);
});

process.on("unhandledRejection", (reason) => {
    logger.error("unhandledRejection", { reason });
});

// ── Arranque del servidor ──────────────────────────────────────────────────
app.listen(PORT, () => {
    logger.info(`Servidor corriendo en el puerto ${PORT}`);
});