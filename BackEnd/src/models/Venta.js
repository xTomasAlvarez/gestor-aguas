import mongoose, { Model, Schema } from "mongoose";

const VentaSchema = new Schema({
    cliente:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Cliente",
        required: true
    },
    fecha:{
        type:Date,
        required:true,
        default: Date.now
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
            }, // Precio congelado al momento de la venta
            subtotal: Number
        }
    ],
    total:{
        type: Number,
        required: true
    },
    metodo_pago: {
        type: String,
        enum: ['efectivo', 'fiado', 'transferencia'], // Lista cerrada de opciones
        default: 'efectivo'
    }
}, {
    timestamps: true
});
// Hay combos con dispenser y bidones, son mensualizados donde el precio de los bidones no se ajusta directamente al unitario
export default mongoose.model("Venta",VentaSchema);