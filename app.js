import express from "express";
import cookieParser from "cookie-parser";
import courses from "./routes/courseRouter.js";
import user from './routes/userRouter.js';
import {errorMiddleware} from './middlewares/errorMiddleware.js';
import payment from "./routes/paymentRouter.js";
import Other from "./routes/otherRoutes.js"
import cors from "cors";
import dotenv from 'dotenv';
dotenv.config({ path: './config/config.env' });



const app = express();
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))

app.use(
    cors({
        origin:process.env.FRONTEND_URL,
        credentials:true,
        methods:["GET","POST","PUT","DELETE"]
    })
)
app.use("/api/v2", payment)
app.use("/api/v2",courses)
app.use("/api/v2",user)
app.use("/api/v2",Other)

app.get("/", (req,res) =>res.send(`<h1>server is working click <a href=${process.env.FRONTEND_URL}></a> to frontend</h1>`))
app.use(errorMiddleware)

export default app;
