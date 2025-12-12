import { Model, Schema } from "mongoose";

import mongoose from 'mongoose';

const ClienteSchema = new Schema({
    nombre: {
        type: String,
        required: true,
        trim: true
    },
    // Dirección opcional porque a veces el nombre ya es la dirección
    direccion: {
        type: String,
        required: false
    },
    telefono: {
        type: String,
        required: false,
        trim: true
    },
    deuda: {
        bidones_20L: { 
            type: Number, 
            default: 0 // Arranca debiendo 0
        },
        bidones_12L: { 
            type: Number, 
            default: 0 
        },
        sodas: { 
            type: Number, 
            default: 0 
        }
    },
    activo: {
        type: Boolean,
        default: true // Por si tu papá quiere "borrar" un cliente sin perder el historial, solo lo desactiva.
    }
}, {
    timestamps: true // Esto crea automáticamente campos: createdAt y updatedAt. ¡Muy útil!
});

// Exportamos el modelo para usarlo en los controladores
export default mongoose.model('Cliente', ClienteSchema);