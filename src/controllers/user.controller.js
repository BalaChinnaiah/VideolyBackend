import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken"

const generateAccessTokenAndRefreshToken = async(userId) => {

    try
    {

        const user = await User.findById(userId)

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save( {validateBeforeSave : false })

        return { accessToken, refreshToken }
    }

    catch(error){

        console.log(error)

        throw new ApiError(500, "something went wrong while generating Access and Refresh Token..!!")
    }
}

const registerUser = AsyncHandler ( async (req,res) => {
    
    // Get User Details from Front end

    const {username, fullname, email, password } = req.body;
    console.log("email=", email);

    // Check for validation - not empty
    if(
        [email,password,fullname,username].some( (field)=>field?.trim()==="")
    ){
        return new ApiError(400, " All Fields are Required..!!")
    }

    // Find whether the user exists - username or email
    const existedUser = await User.findOne(
        {
            $or: [{ username }, { email }]
        }
    )

    if(existedUser)
    {
        throw new ApiError( 409, " User with username or Email already Exists")
    }

    // Check for images - avatar and coverImage
    
    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0].path;

    let coverImageLocalPath;

    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0)
    {
        coverImageLocalPath = req.files.coverImage[0].path
    }

    if(!avatarLocalPath)
    {
        throw new ApiError(400, "Avatar File is Required..!!")
    }

    // Upload files on Cloudinary
    
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar)
    {
       throw new ApiError(400, "Avatar File is Required..!!") 
    }

    // Create user object - create entry in DB
    const user = await User.create({
        fullname,
        avatar : avatar.url,
        coverImage :coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    // Remove password and refreshToken from the response

    const createdUser = await User.findById(user._id).select(

        "-password -refreshToken"
    )

    // Check whether the user is created or not

    if(!createdUser)
    {
        throw new ApiError(500, " Something went wrong while registering the User")
    }

    // Return Response

    return res.status(201).json(

        new ApiResponse(200, createdUser, "User Registered Successfully..!!")
    )


    


} )

const loginUser = AsyncHandler( async (req,res) => {

    // get data from req body

    const { username, email, password } = req.body

    // validate username and email
    
    if( !username && !email)
    {
        throw new ApiError( 400, " Username or Email is Required ")
    }

    // Check the user exist or not
    const user =  await User.findOne({
        $or : [{ username }, { email }]
    })

    if(!user)
    {
        throw new ApiError(404, " User not Registered..!!")
    }

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid)
    {
        throw new ApiError(401, " Invalid Password..!! ")
    }

    // Generate Access Token and Refresh Token
    const { accessToken, refreshToken } = await generateAccessTokenAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user : loggedInUser, accessToken, refreshToken
            },
            "User Loggedin Successfully"
        )
    )



})

const logoutUser = AsyncHandler( async (req,res) => {

    await User.findByIdAndUpdate( req.user._id,
    {
        $set : { refreshToken : undefined}
    },
    {
        after : true
    } )

    const options = {
        httpOnly : true,
        secure : true
    }

    return res.status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json( new ApiResponse(200, {}, "User Logged Out..!!"))

})

const refreshAccessToken = AsyncHandler( async (req, res)=>{

    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(incomingRefreshToken)
    {
        throw new ApiError(401, "Unauthorized request")
    }


       try {
         const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
 
         const user = User.findById(decodedToken?._id)
 
         if(!user)
         {
             throw new ApiError(401, " Invalid Refresh Token ")
         }
 
         if(incomingRefreshToken != user?.refreshToken)
         {
            throw new ApiError(401, " Refresh Token is expired or Used..!!") 
         }
 
         const options = {
             httpOnly : true,
             secure : true
         }
 
         const {accessToken, NewrefreshToken} = await generateAccessTokenAndRefreshToken(user._id)
 
         return res
         .status(200)
         .cookie("accessToken", accessToken, options)
         .cookie("refreshToken", NewrefreshToken, options)
         .json(
             new ApiResponse(
                 200,
                 {
                     accessToken, refreshToken : NewrefreshToken, 
                 },
                 "Access Token Refreshed Successfully"
             )
         )
 
       } catch (error) {

        throw new ApiError(401, error?.message || "Invalid Refresh Token..!!")
        
       }

    }
)

export {registerUser, loginUser, logoutUser , refreshAccessToken }