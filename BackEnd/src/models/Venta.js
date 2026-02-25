import mongoose from "mongoose";

const { Schema, model } = mongoose;

// ── Sub-schema: Item de venta ──────────────────────────────────────────────
const itemSchema = new Schema(
    {
        producto: {
            type:     String,
            enum:     ["Bidon 20L", "Bidon 12L", "Soda"],
            required: [true, "El producto es obligatorio."],
        },
        cantidad: {
            type:     Number,
            required: [true, "La cantidad es obligatoria."],
            min:      [1, "La cantidad mínima es 1."],
        },
        precio_unitario: {
            type:     Number,
            required: [true, "El precio unitario es obligatorio."],
            min:      [0, "El precio no puede ser negativo."],
        },
        subtotal: {
            type:     Number,
            required: [true, "El subtotal es obligatorio."],
        },
    },
    { _id: false }
);

// ── Schema principal: Venta ────────────────────────────────────────────────
const ventaSchema = new Schema(
    {
        cliente: {
            type:     Schema.Types.ObjectId,
            ref:      "Cliente",
            required: [true, "El cliente es obligatorio."],
        },
        fecha: {
            type:    Date,
            default: Date.now,
        },
        items: {
            type:     [itemSchema],
            validate: {
                validator: (arr) => arr.length > 0,
                message:   "La venta debe tener al menos un item.",
            },
        },
        descuento: {
            type:    Number,
            default: 0,
            min:     [0, "El descuento no puede ser negativo."],
        },
        total: {
            type:     Number,
            required: [true, "El total es obligatorio."],
        },
        metodo_pago: {
            type:    String,
            enum:    ["efectivo", "fiado", "transferencia"],
            default: "efectivo",
        },
        monto_pagado: {
            type:    Number,
            default: 0,
            min:     [0, "El monto pagado no puede ser negativo."],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Venta = model("Venta", ventaSchema);

export default Venta;