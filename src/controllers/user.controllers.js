import { Apierror } from "../utils/apierror.js";
import { asyncHander } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/Apiresponse.js";

const generateAccessAnsdRefreshTokan=async (userId)=>{
   try {
      const user=await User.findById(userId)
      const accesTokan=user.generateAccessToken()
      const refreshTokan=user.generateRefreshToken()

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
  if(!username || !email){
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
.clearCookie("accessTokan",options)
.json(new ApiResponse(200,{},"User logged Out"))

})


export {registerUser,loginUser,logoutUser}