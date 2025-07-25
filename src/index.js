// require('dotenv').config({path:'./env'})
import dotenv from "dotenv";
import connectDB from "./db/index.js";
import app from './app.js'

dotenv.config({
  path: "./env",
});

connectDB()
  .then(()=>{
    app.listion(process.env.PORT || 4000, ()=>{
      console.log(`server is running on port no: ${process.env.PORT}`)
    })
  })
  .catch((error) => console.error("Mongo db connectin fail !!!!: ", error));
/*
import express from "express";
const app = express()(async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
    app.on('error',(error)=>{
        console.log("Error:",error)
        throw error
    })
    app.listen(process.env.PORT,()=>{
        console.log(`your app is running of port no ${process.env.PORT}`)
    })
    
  } catch (error) {
    console.error("Error :", error);
  }
})();
*/
