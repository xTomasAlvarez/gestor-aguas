// ── Dependencias externas ──────────────────────────────────────────────────
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import helmet from "helmet";
import cookieParser from "cookie-parser";

// ── Importaciones internas ─────────────────────────────────────────────────
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

// ── Inicialización de Express ──────────────────────────────────────────────
const app = express();

// ── 1. Configuración Dinámica y Crítica de CORS ───────────────────────────
const corsOptions = {
    origin: function (origin, callback) {
        const allowedOrigins = [
            process.env.FRONTEND_URL, // La URL principal (producción o el localhost de tu .env)
            "https://h2app-one.vercel.app",
            "http://localhost:5173",  // Vite por defecto
            "http://127.0.0.1:5173"   // Alternativa local
        ];

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

app.use(cors(corsOptions));

if (process.env.NODE_ENV === "production") {
    app.use((req, res, next) => {
        if (req.headers["x-forwarded-proto"] !== "https") {
            return res.redirect(301, `https://${req.headers.host}${req.url}`);
        }
        next();
    });
}

// ── Middlewares globales de Ciberseguridad ──────────────────────────────────
app.use(helmet());
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

app.use((req, res, next) => {
    const sanitize = (obj) => {
        if (obj && typeof obj === "object") {
            for (const key of Object.keys(obj)) {
                if (/^\$/.test(key)) {
                    delete obj[key];
                } else {
                    sanitize(obj[key]);
                }
            }
        }
    };
    if (req.body)   sanitize(req.body);
    if (req.params) sanitize(req.params);
    next();
});

const limiterGlobal = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 100,
    message: { message: "Demasiadas peticiones desde esta IP. Inténtalo más tarde." },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiterGlobal);

// ── 3. Otros Middlewares Globales ──────────────────────────────────────────
const morganFormat = process.env.NODE_ENV === "production" ? "combined" : "dev";
app.use(morgan(morganFormat, {
    stream: { write: (message) => logger.http(message.trim()) }
}));

// ── Rutas de la API ──────────────────────────────────────────────
app.use("/api/auth",     authRoutes);
app.use("/api/clientes",  proteger, checkStatus, clientesRoutes);
app.use("/api/ventas",    proteger, checkStatus, ventasRoutes);
app.use("/api/gastos",    proteger, checkStatus, gastosRoutes);
app.use("/api/llenados",  proteger, checkStatus, llenadoRoutes);
app.use("/api/stats",     proteger, checkStatus, statsRoutes);
app.use("/api/admin",     proteger, checkStatus, adminRoutes);
app.use("/api/config",    proteger, checkStatus, configRoutes);
app.use("/api/inventario", proteger, checkStatus, inventarioRoutes);
app.use("/api/superadmin", proteger, soloSuperAdmin, superAdminRoutes);

export default app;
