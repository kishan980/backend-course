import express from "express";
import cookieParser from "cookie-parser";
import courses from "./routes/courseRouter.js";
import user from './routes/userRouter.js';
import errorMiddleware from './middlewares/errorMiddleware.js';
import payment from "./routes/paymentRouter.js";
import Other from "./routes/otherRoutes.js"

const app = express();
app.use(cookieParser())
app.use(express.json())
app.use(express.urlencoded({
    extended:true
}))
app.use("/api/v2", payment)
app.use("/api/v2",courses)
app.use("/api/v2",user)
app.use("/api/v2",Other)
export default app;

app.use(errorMiddleware)