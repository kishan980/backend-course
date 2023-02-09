import jwt from "jsonwebtoken"
import errorHandlerUtils from "../utils/errorHandlerUtils.js";
import { User } from "../models/User.js";
import { catchAsyncError } from "./catchAsyncErrors.js"

export const isAuthenticated = catchAsyncError(async(req,res,next) =>{
    const {token} = req.cookies;
    if(!token) return next(new errorHandlerUtils("Not logged In.",401))

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded) return next(new errorHandlerUtils("token is not valid",400))

    req.user = await User.findById({_id:decoded._id});
    next()
})

export const authorizeAdmin = (req,res,next) =>{

    if(req.user.role !== "admin")
    return next(
        new errorHandlerUtils(`${req.user.role} is not allowed to access this resource`,403)
    )
    next()
}

export const authorizeSubscriber = (req,res,next)=>{
    if(req.user.subscription.status !=="active" &&req.user.role !=="admin")
    return next(new 
        (`Only Subscribers can this resource`,403))
    next();
}