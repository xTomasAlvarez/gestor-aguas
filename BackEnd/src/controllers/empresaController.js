import Empresa from "../models/Empresa.js";
import Usuario from "../models/Usuario.js";

// ── POST /api/admin/empresa/crear ──────────────────────────────────────────
// Para admins existentes que no tienen empresa asignada todavía.
export const crearEmpresa = async (req, res) => {
    try {
        if (req.usuario.businessId)
            return res.status(400).json({ message: "Ya tenés una empresa asignada." });

        const { nombre } = req.body;
        if (!nombre?.trim())
            return res.status(400).json({ message: "El nombre de la empresa es obligatorio." });

        const empresa = await Empresa.create({ nombre: nombre.trim() });

        // Vincular al usuario admin con la nueva empresa
        await Usuario.findByIdAndUpdate(req.usuario._id, { businessId: empresa._id });

        res.status(201).json({ nombre: empresa.nombre, codigoVinculacion: empresa.codigoVinculacion });
    } catch (err) {
        console.error("[crearEmpresa]", err);
        res.status(500).json({ message: "Error al crear la empresa.", detalle: err.message });
    }
};

// ── PATCH /api/admin/empresa/regenerar-codigo ──────────────────────────────
// Genera un nuevo codigoVinculacion para la empresa del admin autenticado.
// El código anterior deja de ser válido inmediatamente.
export const regenerarCodigo = async (req, res) => {
    try {
        if (!req.usuario.businessId)
            return res.status(404).json({ message: "No tenés una empresa asignada." });

        const empresa = await Empresa.findById(req.usuario.businessId);
        if (!empresa)
            return res.status(404).json({ message: "Empresa no encontrada." });

        // Generar un código nuevo único (reintenta si colisiona)
        let nuevo;
        let intentos = 0;
        do {
            nuevo = Empresa.generarCodigo();
            intentos++;
        } while (
            (await Empresa.exists({ codigoVinculacion: nuevo, _id: { $ne: empresa._id } })) &&
            intentos < 10
        );

        empresa.codigoVinculacion = nuevo;
        await empresa.save();

        res.json({ codigoVinculacion: empresa.codigoVinculacion, nombre: empresa.nombre });
    } catch (err) {
        console.error("[regenerarCodigo]", err);
        res.status(500).json({ message: "Error al regenerar el código.", detalle: err.message });
    }
};

