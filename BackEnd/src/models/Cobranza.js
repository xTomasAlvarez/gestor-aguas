import mongoose from "mongoose";

const { Schema, model } = mongoose;

const cobranzaSchema = new Schema(
    {
        venta: {
            type: Schema.Types.ObjectId,
            ref: "Venta",
            required: [true, "La venta (ticket) asociada es obligatoria."]
        },
        cliente: {
            type: Schema.Types.ObjectId,
            ref: "Cliente",
            required: [true, "El cliente es obligatorio."]
        },
        monto: {
            type: Number,
            required: [true, "El monto abonado es obligatorio."],
            min: [0, "El monto no puede ser negativo."]
        },
        metodoPago: {
            type: String,
            enum: ["efectivo", "transferencia"],
            required: [true, "El método de pago es obligatorio."]
        },
        fecha: {
            type: Date,
            default: Date.now
        },
        businessId: {
            type: Schema.Types.ObjectId,
            ref: "Empresa",
            default: null,
            index: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

const Cobranza = model("Cobranza", cobranzaSchema);

export default Cobranza;
