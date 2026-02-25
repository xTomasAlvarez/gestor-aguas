import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ── Sub-schema: Deuda (envases físicos que debe el cliente) ────────────────
const deudaSchema = new Schema(
    {
        bidones_20L: { type: Number, default: 0 },
        bidones_12L: { type: Number, default: 0 },
        sodas:       { type: Number, default: 0 },
    },
    { _id: false } // No necesita _id propio al ser un subdocumento
);

// ── Schema principal: Cliente ──────────────────────────────────────────────
const clienteSchema = new Schema(
    {
        nombre: {
            type:     String,
            required: [true, "El nombre del cliente es obligatorio."],
            trim:     true,
        },
        direccion: {
            type:    String,
            trim:    true,
            default: null,
        },
        telefono: {
            type:    String,
            trim:    true,
            default: null,
        },
        deuda: {
            type:    deudaSchema,
            default: () => ({}), // Inicializa con todos los campos en 0
        },
        activo: {
            type:    Boolean,
            default: true,
        },
    },
    {
        timestamps: true, // Agrega createdAt y updatedAt automáticamente
        versionKey: false,
    }
);

// ── Índice compuesto para anti-duplicados (nombre + dirección) ─────────────
// Permite null en direccion, solo bloquea duplicados cuando AMBOS coinciden
clienteSchema.index(
    { nombre: 1, direccion: 1 },
    {
        unique: true,
        partialFilterExpression: { direccion: { $type: "string" } },
    }
);

// ── Índice único para teléfono (solo cuando se provee) ────────────────────
clienteSchema.index(
    { telefono: 1 },
    {
        unique: true,
        sparse: true, // Ignora documentos donde telefono es null/undefined
    }
);

const Cliente = model("Cliente", clienteSchema);

export default Cliente;