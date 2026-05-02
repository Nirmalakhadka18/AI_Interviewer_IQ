import mongoose from "mongoose";


const connectDB = async ()=>{
    try{
         await mongoose.connect(process.env.MONGODB_URL)
         console.log("Database Connected")
    }
    catch(error){
console.log(`Database error ${error}`);
    }
}

export default(connectDB)