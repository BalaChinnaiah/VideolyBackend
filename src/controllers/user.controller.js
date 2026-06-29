import { AsyncHandler } from "../utils/AsyncHandler.js";
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/Cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";





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
    const existedUser = User.findOne(
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
    const coverImageLocalPath = req.files?.coverImage[0].path;

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

export {registerUser}