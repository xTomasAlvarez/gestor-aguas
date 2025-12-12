import mongoose, { Schema } from "mongoose";

const LlenadoSchema = new Schema({
    fecha:{
        type:Date,
        default:Date.now,
        required:true
    },
    items: [
        {
            producto: { 
                type: String, 
                required: true, 
                enum: ['Bidon 20L', 'Bidon 12L', 'Soda'] // Solo permitimos estos nombres para evitar errores de tipeo
            },
            cantidad: { 
                type: Number,
                required: true,
                min: 1
            },
            precio_unitario: {
                type: Number,
                required: true
            },
            subtotal: Number
        }
    ],
    total:{
        type: Number,
        required: true
    }
}, {
    timestamps: true
});

export default mongoose.model("Llenado", LlenadoSchema)