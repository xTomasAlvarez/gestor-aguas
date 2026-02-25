import mongoose from "mongoose";

const { Schema, model } = mongoose;

const gastoSchema = new Schema(
    {
        fecha: {
            type:    Date,
            default: Date.now,
        },
        concepto: {
            type:     String,
            required: [true, "El concepto del gasto es obligatorio."],
            trim:     true,
        },
        monto: {
            type:     Number,
            required: [true, "El monto es obligatorio."],
            min:      [0, "El monto no puede ser negativo."],
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

const Gasto = model("Gasto", gastoSchema);

export default Gasto;