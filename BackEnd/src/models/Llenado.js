import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ── Sub-schema: Producto llenado ───────────────────────────────────────────
const productoLlenadoSchema = new Schema(
    {
        producto: {
            type:     String,
            enum:     ["Bidon 20L", "Bidon 12L", "Soda"],
            required: [true, "El tipo de producto es obligatorio."],
        },
        cantidad: {
            type:     Number,
            required: [true, "La cantidad es obligatoria."],
            min:      [1, "La cantidad mínima es 1."],
        },
    },
    { _id: false }
);

const llenadoSchema = new Schema(
    {
        fecha: {
            type:    Date,
            default: Date.now,
        },
        productos: {
            type:     [productoLlenadoSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message:   "El llenado debe registrar al menos un producto.",
            },
        },
        costo_total: {
            type:    Number,
            default: null,
        },
        gasto_ref: {
            type:    mongoose.Schema.Types.ObjectId,
            ref:     "Gasto",
            default: null,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Llenado = model("Llenado", llenadoSchema);

export default Llenado;