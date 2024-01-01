import { Apierror } from "../utils/apierror.js";
import { asyncHander } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

const verifyJWT=asyncHander(async(req,res,next)=>{
    try {
        const tokan=await req.cookies?.accessTokan || req.header("Authorization")?.replace("Bearer ","")

        if(!tokan){
            throw new Apierror(402,"unauthorized request")
        }
        const decodedToken=jwt.verify(tokan,process.env.ACCESS_TOKEN_SECRET)

        const user=await User.findById(decodedToken?._id).select("-passwod -refreshTokan")

        if(!user){
            throw new Apierror(401,"Invalid access Tokan")
        }

        req.user=user;
        next();

    } catch (error) {
        throw new Apierror(401,error?.message || "Inavlid access tokan")
    }
})

export {verifyJWT}