import { v2 as cloudinary } from "cloudinary";
import path from 'path';
require("dotenv/config");

async function uploadFilesToCloudinary(fileName : string) {
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
        const filePath : string = path.join(__dirname, '../../public', fileName);

        const uploadResult = await cloudinary.uploader.upload(filePath, {
            folder : 'burma-tasty-house', 
            resource_type : 'auto'
        });
        console.log("upload result", uploadResult);
        const url = await cloudinary.url(uploadResult.public_id, {
            transformation: transFormationArray,
        });
        console.log("the success url", url);
        return url;
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

export default uploadFilesToCloudinary;
