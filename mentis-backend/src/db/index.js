import mongoose from "mongoose";
import { DB_NAME } from "./constant.js";

const connectDB= async()=>{
    try{
        const url = (process.env.MONGODB_URL || '').trim();
        const connectionInstance = await mongoose.connect(url, {
            dbName: DB_NAME
        });
        console.log(`Monodb connected! ${connectionInstance.connection.host}`);

    }catch(error){
        console.log(`connection failed! ${error.message}`);
        process.exit(1);
    }
}

export default connectDB;
