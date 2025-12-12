import mongoose, {Schema} from "mongoose";

const GastosSchema = new Schema({
    llenado:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Llenado",
        required:false
    },
    fecha:{
        type: Date,
        default: Date.now,
        required: true
    },
    nombre:{
        type:String,
        required:true,
        trim:true
    },
    monto:{
        type: Number,
        required:true
    }
}, {
    timestamps: true 
});

export default mongoose.model("Gastos", GastosSchema)