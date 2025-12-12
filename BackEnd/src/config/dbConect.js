import mongoose from 'mongoose';

export const dbConect = async (URI) =>{
    try{
        console.log("DB Connected")
        await mongoose.connect(URI)
    }
    catch(err){
        console.log(err)
    }
}