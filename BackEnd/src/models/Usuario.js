import mongoose from "mongoose";
import bcrypt     from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    // El rol NO se acepta desde el cliente; solo se modifica manualmente en Atlas o por admin
    rol:      { type: String, enum: ["admin", "empleado"], default: "empleado" },
    // activo: false = pendiente de aprobación por el admin
    activo:   { type: Boolean, default: false },
}, { timestamps: true, versionKey: false });

// Encriptar antes de guardar
usuarioSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Comparar contraseña plana con hash
usuarioSchema.methods.compararPassword = function (candidato) {
    return bcrypt.compare(candidato, this.password);
};

export default mongoose.model("Usuario", usuarioSchema);
