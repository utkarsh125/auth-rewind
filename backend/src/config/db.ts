import { MONGO_URI } from "../constants/env";
import mongoose from "mongoose"

const connectToDatabase = async() =>{
    try{
        await mongoose.connect(MONGO_URI);
        console.log("Connected to the DB")
    }catch(err){
        console.log("Cannot connect to the database", err);
        process.exit(1);
    }
}

export default connectToDatabase;