import mongoose from "mongoose";
import bcrypt     from "bcryptjs";

const usuarioSchema = new mongoose.Schema({
    nombre:     { type: String, required: true, trim: true },
    email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
    password:   { type: String, required: true, minlength: 6 },
    rol:        { type: String, enum: ["admin", "empleado", "superadmin"], default: "empleado" },
    activo:     { type: Boolean, default: false },
    // businessId: referencia a la empresa a la que pertenece el usuario
    businessId: { type: mongoose.Schema.Types.ObjectId, ref: "Empresa", default: null },
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
