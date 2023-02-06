import jwt from "jsonwebtoken"
import { User } from "../models/User.js";
import ErrorHandlerUtils from "../utils/errorHandlerUtils.js";
import { catchAsyncError } from "./catchAsyncErrors.js"

export const isAuthenticated = catchAsyncError(async(req,rex,next) =>{
    const {token} = req.cookies;
    if(!token) return next(new ErrorHandlerUtils("Not logged In.",401))

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if(!decoded) return next(new ErrorHandlerUtils("token is not valid",400))

    req.user = await User.findById({_id:decoded._id});
    next()
})

export const authorizeAdmin = (req,res,next) =>{

    if(req.user.role !== "admin")
    return next(
        new ErrorHandlerUtils(`${req.user.role} is not allowed to access this resource`,403)
    )
    next()
}

export const authorizeSubscriber = (req,res,next)=>{
    if(req.user.subscription.status !=="active" &&req.user.role !=="admin")
    return next(new ErrorHandlerUtils(`Only Subscribers can this resource`,403))
    next();
}