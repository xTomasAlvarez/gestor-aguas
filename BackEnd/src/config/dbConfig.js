import moongose from 'mongoose';

export const dbConfig = async (URI) =>{
    moongose.connect(URI).
    then(console.log("DB Connected")).
    catch(err => console.log(err))
}