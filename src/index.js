import dotenv from "dotenv"
import connnectDB from "./db/index.js"
import app from "./app.js"

dotenv.config({
    path : './.env'
})

connnectDB()
.then( ()=>{
    app.listen(process.env.PORT || 8000 , ()=>{ console.log("Server is Up and Running on Port ", process.env.PORT)})
    
})
.catch((error)=>console.log("MongoDB Connection Error in Index File!!!", error))





