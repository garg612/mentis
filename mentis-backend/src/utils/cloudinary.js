import {v2 as cloudinary} from "cloudinary";
import dotenv from "dotenv";
import fs from "fs";

dotenv.config();

//cloudinary
cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
});
const uploadOnCloudinary=async(LocalFilePath)=>{
    try{
        if(!LocalFilePath)return null;
        const response=await cloudinary.uploader.upload(
            LocalFilePath,
            { resource_type:"auto"}
        );
        console.log("file uploaded on cloudinary", response);
        fs.unlinkSync(LocalFilePath);
        return {url:response.secure_url || response.url,public_id:response.public_id};
    } catch(error){
        console.log("file upload failed", error?.message || error);
        // Do not delete local file here so caller can fallback to local storage
        return null;
    }
};

const deleteFromCloudinary=async(public_id)=>{
    try{
        const result=await cloudinary.uploader.destroy(public_id);
        console.log("File Deleted from cloudinary",result);
    }
    catch(error){
        console.log("File deletion failed",error);
        return null;
    }
};

export {uploadOnCloudinary,deleteFromCloudinary}