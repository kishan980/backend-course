import app from './app.js';
import dotenv from 'dotenv';
import cloudinary from 'cloudinary';
import Razorpay from 'razorpay';
import nodeCron from "node-cron";

import { connectDb } from './config/database.js';
import { State } from './models/State.js';
dotenv.config({ path: './config/config.env' });

connectDb();
cloudinary.v2.config({
  cloud_name: process.env.CLOUDINARY_CLIENT_NAME,
  api_key: process.env.CLOUDINARY_CLIENT_API,
  api_secret: process.env.CLOUDINARY_CLIENT_SECRET,
});

export const instance = new Razorpay({
  key_id: process.env.RAZOR_API_KEY,
  key_secret: process.env.RAZOR_API_SECRET,
});

// 1  * second // 2  * minutes // 3  * hours // 4  * 1 day // 5  * 1month // 6  * 1 year
nodeCron.schedule("* * * 1 * * ", async ()=>{
  try{
    await State.create({})
  }catch(error){
    console.log(error)
  }
})

const temp = async()=>{
  await State.create({})
}
temp()

app.get("/",(req,res) =>{
  res.send(
    "<h1>Working fine</h1>"
  )
})
app.listen(process.env.PORT, () => {
  console.log(`server is running ${process.env.PORT}`);
});
