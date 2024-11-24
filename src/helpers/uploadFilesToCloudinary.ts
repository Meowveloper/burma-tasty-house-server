import { v2 as cloudinary } from "cloudinary";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import { UploadedFile } from "express-fileupload";
import fs from 'fs';
require("dotenv/config");

cloudinary.config({
    cloud_name: "dvsrz6mfy",
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
});


async function uploadFilesToCloudinary(file: UploadedFile | undefined, fileType: EnumCloudinaryFileTypes): Promise<string | null> {
    try {
        if(!file) return null;
        const folderName = process.env.ENVIRONMENT === "production" ? "burma-tasty-house-production" : "burma-tasty-house";
        const byteArrayBuffer = fs.readFileSync(file.tempFilePath);
        const url: string | null = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
                {
                    folder: folderName,
                    resource_type: fileType,
                },
                (error, result) => {
                    if (error) {
                        reject(new Error("Error uploading file to Cloudinary"));
                    } else {
                        resolve(result?.secure_url || null);
                    }
                }
            );

            // End the stream with the file's data buffer
            stream.end(byteArrayBuffer);
        });

        if (!url) throw new Error("Error: Cloudinary did not return a URL");
        return url;
    } catch (e) {
        console.log("error while uploading file to cloudinary", e);
        return null;
    }
}

export default uploadFilesToCloudinary;
