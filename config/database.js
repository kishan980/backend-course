import mongoose from "mongoose";

export const connectDb = async ()=>{
    try{
        const {connection}= await mongoose.connect(process.env.MONGO_DB_URL, { useNewUrlParser: true,  })
        console.log(`mongo db  connection with ${connection.host}`)
    }catch(error){
        console.log(error)
    }
}