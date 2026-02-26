import mongoose from "mongoose";

// Genera un código de 6 caracteres alfanumérico legible (sin O, 0, I, l para evitar confusión)
const generarCodigo = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
};

const empresaSchema = new mongoose.Schema({
    nombre:             { type: String, required: true, trim: true },
    codigoVinculacion:  { type: String, unique: true, uppercase: true, trim: true },
}, { timestamps: true, versionKey: false });

// Auto-genera el código antes de la primera inserción
empresaSchema.pre("save", function () {
    if (!this.codigoVinculacion) {
        this.codigoVinculacion = generarCodigo();
    }
});

export default mongoose.model("Empresa", empresaSchema);
