import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
require("dotenv/config");

async function uploadFilesToCloudinary(fileName: string, fileType : EnumCloudinaryFileTypes): Promise<string | null> {
    try {
        cloudinary.config({
            cloud_name: "dvsrz6mfy",
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET,
            secure: true,
        });

        const transFormationArray = [
            {
                fetch_format: "auto",
                quality: "auto",
            },
        ];
        const filePath: string = path.join(__dirname, "../../public", fileName);
        if (!fs.existsSync(filePath)) {
            console.log(`File does not exist: ${filePath}`);
            throw new Error("File not found");
        }
        const folderName = process.env.ENVIRONMENT === 'production' ? 'burma-tasty-house-production' : 'burma-tasty-house'; 

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder: folderName,
            resource_type: fileType,
            public_id: fileName,
        });
        console.log("upload result", uploadResult);
        return uploadResult.secure_url;
    } catch (e) {
        console.log(e);
        return null;
    }
}

export default uploadFilesToCloudinary;
