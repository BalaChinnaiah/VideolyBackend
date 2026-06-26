import {v2 as cloudinary } from "cloudinary"

import fs from "fs"

cloudinary.config({ 
  cloud_name: 'videoly', 
  api_key: '237718992176584', 
  api_secret: 'RClmCnIpRnGTSKB6Lgmy_yn66IE'
});

const uploadOnCloudinary = async (localFilePath) => {

    try{
        if(!localFilePath) return null

        // File Upload to Cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {resource_type:"auto"})

        // File has been uploaded successfully
        console.log(" File has beeen Uploaded to cloudinary !!", response.url);
        return response;

    }

    catch(error){

        fs.unlinkSync(localFilePath) // remove file from the server as the upload operation got failed

        return null;
    }
}

export {uploadOnCloudinary}