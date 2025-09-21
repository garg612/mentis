import jwt from 'jsonwebtoken';
import {User} from"../models/user.models.js"
import { Apierror } from "../utils/Apierror.js";
import { asyncHandler } from "../utils/asynchandler.js";

export const verifyJWT=asyncHandler(async(req,_,next)=>{
    const token=
    req.cookies.access_token||
    req.header("Authorization")?.replace("Bearer ","");

    console.log("token reciverd",token);

    if(!token){
        return next(new Apierror(401,"Unauthorized"))
    }
    try{
    const decodedToken=jwt.verify(token,process.env.ACCESS_TOKEN_SECRET);
    const user=await User.findById(decodedToken._id).select("-password -refreshToken");

    if(!user){
        return next(new Apierror(401,"Forbidden"));
    }

    req.user=user;
    next();
    }catch(error){
    return next(new Apierror(401,"Invalid Access Token"))
    }
});