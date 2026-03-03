import winston from "winston";

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Formato legible para desarrollo
const devFormat = combine(
    colorize(),
    timestamp({ format: "HH:mm:ss" }),
    errors({ stack: true }),
    printf(({ level, message, timestamp, stack }) =>
        stack
            ? `[${timestamp}] ${level}: ${message}\n${stack}`
            : `[${timestamp}] ${level}: ${message}`
    )
);

// Formato JSON para producción (fácil de ingestar en herramientas de monitoreo)
const prodFormat = combine(
    timestamp(),
    errors({ stack: true }),
    winston.format.json()
);

const logger = winston.createLogger({
    level: process.env.NODE_ENV === "production" ? "info" : "debug",
    format: process.env.NODE_ENV === "production" ? prodFormat : devFormat,
    transports: [
        new winston.transports.Console(),
        // En producción, también escribir a archivo
        ...(process.env.NODE_ENV === "production"
            ? [
                new winston.transports.File({ 
                    filename: "logs/error.log", 
                    level: "error" 
                }),
                new winston.transports.File({ 
                    filename: "logs/combined.log" 
                }),
              ]
            : [])
    ],
});

export default logger;
