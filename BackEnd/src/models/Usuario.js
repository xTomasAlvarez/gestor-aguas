import mongoose from "mongoose";
import bcrypt     from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    nombre:   { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    rol:      { type: String, enum: ["admin", "empleado"], default: "empleado" },
}, { timestamps: true });

// Encriptar antes de guardar (Mongoose 6+: async hook no usa next)
usuarioSchema.pre("save", async function () {
    if (!this.isModified("password")) return;
    this.password = await bcrypt.hash(this.password, 12);
});

// Comparar contraseña plana con hash
usuarioSchema.methods.compararPassword = function (candidato) {
    return bcrypt.compare(candidato, this.password);
};

export default mongoose.model("Usuario", usuarioSchema);
