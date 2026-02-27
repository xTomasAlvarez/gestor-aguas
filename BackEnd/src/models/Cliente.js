import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ── Sub-schema: Deuda (envases físicos que debe el cliente) ────────────────
const deudaSchema = new Schema(
    {
        bidones_20L: { type: Number, default: 0 },
        bidones_12L: { type: Number, default: 0 },
        sodas:       { type: Number, default: 0 },
        saldo:       { type: Number, default: 0 }, // Deuda monetaria ($)
    },
    { _id: false }
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
        dispensersAsignados: {
            type:    Number,
            default: 0,
            min:     0,
        },
        activo: {
            type:    Boolean,
            default: true,
        },
        businessId: {
            type:    mongoose.Schema.Types.ObjectId,
            ref:     "Empresa",
            default: null,
            index:   true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// ── Índice compuesto para anti-duplicados (nombre + dirección) ─────────────
// Permite null en direccion, solo bloquea duplicados cuando AMBOS coinciden dentro de la misma empresa
clienteSchema.index(
    { businessId: 1, nombre: 1, direccion: 1 },
    {
        unique: true,
        partialFilterExpression: { direccion: { $type: "string" } },
    }
);

// ── Índice único para teléfono por empresa (solo cuando se provee) ─────────
clienteSchema.index(
    { businessId: 1, telefono: 1 },
    {
        unique: true,
        sparse: true, // Ignora documentos donde telefono es null/undefined
    }
);

const Cliente = model("Cliente", clienteSchema);

export default Cliente;