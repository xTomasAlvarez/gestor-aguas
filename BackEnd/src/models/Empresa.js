import mongoose from "mongoose";

// Genera un código de 6 caracteres alfanumérico legible (sin O, 0, I, l para evitar confusión)
const generarCodigo = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const inventarioItemSchema = new mongoose.Schema({
    cantidadTotal:   { type: Number, default: 0, min: 0 },
    costoReposicion: { type: Number, default: 0, min: 0 }
}, { _id: false });

const productoSchema = new mongoose.Schema({
    key:           { type: String, required: true },
    label:         { type: String, required: true },
    precioDefault: { type: Number, required: true, min: 0 }
}, { _id: false });

const empresaSchema = new mongoose.Schema({
    nombre:             { type: String, required: true, trim: true },
    codigoVinculacion:  { type: String, unique: true, uppercase: true, trim: true },
    suspendida:         { type: Boolean, default: false },
    logo:               { type: String, default: null, trim: true },
    telefono:           { type: String, default: null, trim: true },
    onboardingCompletado: { type: Boolean, default: false },
    productos: {
        type: [productoSchema],
        default: [
            { key: "Bidon 20L", label: "Bidón 20L", precioDefault: 2500 },
            { key: "Bidon 12L", label: "Bidón 12L", precioDefault: 1800 },
            { key: "Soda",      label: "Soda",      precioDefault: 900  },
        ]
    },
    inventario: {
        bidones20L: { type: inventarioItemSchema, default: () => ({ cantidadTotal: 0, costoReposicion: 0 }) },
        bidones12L: { type: inventarioItemSchema, default: () => ({ cantidadTotal: 0, costoReposicion: 0 }) },
        sodas:      { type: inventarioItemSchema, default: () => ({ cantidadTotal: 0, costoReposicion: 0 }) },
        dispensers: { type: inventarioItemSchema, default: () => ({ cantidadTotal: 0, costoReposicion: 0 }) }
    }
}, { timestamps: true, versionKey: false });

// Auto-genera el código antes de la primera inserción
empresaSchema.pre("save", function () {
    if (!this.codigoVinculacion) {
        this.codigoVinculacion = generarCodigo();
    }
});

// Static para usar desde otros módulos
empresaSchema.statics.generarCodigo = generarCodigo;

export default mongoose.model("Empresa", empresaSchema);
