// require('dotenv').config({path:'./env'})
import dotenv from "dotenv"

import connectDB from "./db/db.js";

dotenv.config({path:'./env'})

connectDB();

/*
// first apporoach

( async ()=>{  
    try{
 await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    app.on("error",(error)=>{
      console.log("ERROR: ",error);
      throw error
    })
    app.listen(process.env.PORT,()=>{
      console.log(`app is listening on port ${process.env.PORT}`)
    })
    }catch(error){
  console.error("ERROR : ",error)
  throw err
    }
})()

*/