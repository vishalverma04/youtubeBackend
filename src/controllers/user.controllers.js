import { Apierror } from "../utils/apierror.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";
import jwt from "jsonwebtoken";
import { response } from "express";

const generateAccessAnsdRefreshTokan=async (userId)=>{
   try {
      const user=await User.findById(userId)
      const accesTokan=user.generateAccessToken()
      const refreshTokan=user.generateRefreshTokens()

      user.refreshToken=refreshTokan;
      await user.save({validateBeforeSave:false})

      return {accesTokan,refreshTokan}
   } catch (error) {
      throw new Apierror(500,"something went wrong while generating access and refresh tokan")
   }
}

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

const loginUser=asyncHander(async (req,res)=>{
  // take data from req.body
  // check empty credentials
  // find user from username or email
  // check user is exists
  // check password
  // generate access ans refresh token 
  // send cookies

  //take data from req.body
  const {username,email,password}=req.body
 
  //check empty credentials
  if(!username && !email){
   throw new Apierror(400,"username or email required")
  }
  
  //find user
  const user=await User.findOne({
   $or:[{username},{email}]
  })
  
  if(!user){
   throw new Apierror(404,"user does not exits")
  }

  //check password
  const isPasswordValid=await user.isPasswordCorrect(password)

  if(!isPasswordValid){
   throw new Apierror(404,"invalid password")
  }

  //generate access ans refresh tokan
   const {accesTokan,refreshTokan}=await generateAccessAnsdRefreshTokan(user._id)

   const loggedInUser=await User.findById(user._id).select(
      "-password -refreshTokan"
   )
   const options={
      httpOnly:true,
      secure:true
   }
   //send response
   res.status(200)
   .cookie("accessTokan",accesTokan,options)
   .cookie("refreshTokan",refreshTokan,options)
   .json(
      new ApiResponse(200,{user:loggedInUser,accesTokan,refreshTokan},"user succesfully logged in")
   )

})

const logoutUser=asyncHander(async (req,res)=>{

 await User.findByIdAndUpdate(req.user._id,{
   $set:{
      refreshTokan:undefined
   }
 },
 {new:true}
 )
 
 const options={
   httpOnly:true,
   secure:true
}
 
res.status(200)
.clearCookie("accessTokan",options)
.clearCookie("refreshTokan",options)
.json(new ApiResponse(200,{},"User logged Out"))

})

const refreshAccessToken=asyncHander(async (req,res)=>{
   try {
      const incommingRefreshToken=req.cookies.refreshTokan || req.body.refreshTokan;
      if(!incommingRefreshToken){
         throw new Apierror(401,"Unauthorised tokan")
      }
      const decodedInfo=jwt.verify(incommingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
      const user=await User.findById(decodedInfo?._id);
      if(!user){
         throw new Apierror(401,"Invalid tokan")
      }
      if(incommingRefreshToken !==user?.refreshTokan){
         throw new Apierror(402,"Tokan is expired or used")
      }
      const options={
         httpOnly:true,
         secure:true
      }
      const {accesTokan,newRefreshTokan}=await generateAccessAnsdRefreshTokan(user._id)
      return res.status(201)
      .cookie("accessToken",accesTokan,options)
      .cookie("refreshTokan",newRefreshTokan,options)
      .json(new ApiResponse(200,{accesTokan,refreshTokan:newRefreshTokan},"Access tokan refreshed"))
   
   } catch (error) {
      throw new Apierror(401,error?.message||"invalid refresh tokan")
   }
})

const changeCurrentPassword=asyncHander(async(req,res)=>{
   const {oldPassword,newPassword}= req.body

   const user=await User.findById(req.user?._id)

   const isValidPassword=await user.isPasswordCorrect(oldPassword)
   if(!isValidPassword){
      throw new Apierror(404,"old Password is incorrect")
   }
   user.password=newPassword
   await user.save({validateBeforeSave:false})

   return res.status(200)
   .json(new ApiResponse(200,{},"password changed successfully"))
})

const getCurrentUser=asyncHander(async(req,res)=>{
   return res.status(200)
   .json(200,req.user,"current user fetched successfully")
})

const updateAccountDetails=asyncHander(async(req,res)=>{
   const {fullName,email}=req.body

   if(!fullName || !email){
      throw new Apierror(402,"All fields are required")
   }
   const user=User.findByIdAndUpdate(req.user?._id,
     {
       $set:{
         fullName,
         email
       }
     },{new :true} 
      ).select("-password")

      res.status(200)
      .json(new ApiResponse(200,user,"Accounts details successfully"))
})

const updateUserAvatar=asyncHander(async(req,res)=>{
  // get avatar from frontent
  const avatarLocalPath=req.file?.path
  
  if(!avatarLocalPath){
    throw new Apierror(400,"Avatar file is missing")
  }
  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url){
   throw new Apierror(400,"Error while uploading on avatar")
  }
  const user=await User.findByIdAndUpdate(req.user?._id,{
   $set:{
    avatar:avatar.url
   }
  },{new:true}).select("-password")

  return res.status(200)
  .json(new ApiResponse(200,user,"Avatar changes successfully"))

})

export 
{
   registerUser,
   loginUser,
   logoutUser,
   refreshAccessToken,
   changeCurrentPassword,
   getCurrentUser,
   updateAccountDetails,
   updateUserAvatar
}