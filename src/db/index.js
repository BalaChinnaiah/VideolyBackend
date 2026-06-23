import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const connnectDB = async () => {

    try{
       const connectionInstance =  await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

       console.log(`MOngo DB Connected!! DB Host : ${connectionInstance.connection.host}`);

    }

    catch(error)
    {
        console.log("MONGO DB Connection Error", error);
        process.exit(1);
    }
}

export default connnectDB;