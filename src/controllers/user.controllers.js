import { Apierror } from "../utils/apierror.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import {stringify} from "flatted"

const registerUser= asyncHander(async (req,res)=>{

     //get user data from frontend
     //validation - not empty
     //           - username,email already exists
     // check for images/avatar
     //upload them to cloudinary
     //create user
     //remove password refresh token field from response
     //check for user creation
     //return res
      

     // get user data from frontend
     const {fullName,email,username,password}=req.body
     
     //check for empty entity
     if(
        [username,fullName,email,password].some((field)=>{
             field === "";
        })
     ){
           throw new Apierror(400,"all entry are required")
     }
 
     // check username/email already exists
     const existedUser=await User.findOne({
        $or:[
            {username},{email}
        ]
     })
     if(existedUser){
        throw new Apierror(409,"user already existed")
     }
   //check for images/avatar

     const avatarLocalPath=req.files?.avatar[0].path;
 
     if(!avatarLocalPath){
        throw new Apierror(410,"avatar is required")
     }
    
     //upload on cloudinary
     const avatar=await uploadOnCloudinary(avatarLocalPath)
     
    //create user
     const user=await User.create({
        username,
        email,
        fullName,
        password,
        avatar:avatar.url,
     })
    
     // remove password and refresh token
     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
     )
     // check for user creation
     if(!createdUser){
        throw new Apierror(500,"something went wrong while registering the user")
     }
     
     return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Successfully")
     )

})

export {registerUser}