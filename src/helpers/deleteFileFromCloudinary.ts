import { v2 as cloudinary } from "cloudinary";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import extractPublicIdFromCloudinarySecureUrl from "./extractPublicIdFromCloudinarySecureUrl";
require("dotenv/config");

async function deleteFileFromCloudinary(fileUrl: string | null, fileType: EnumCloudinaryFileTypes): Promise<void> {
    cloudinary.config({
        cloud_name: "dvsrz6mfy",
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true,
    });

    try {
        if (!fileUrl) return;

        // Extract the public_id from the URL
        const public_id = extractPublicIdFromCloudinarySecureUrl(fileUrl);

        console.log("public_id", public_id);

        // Call the destroy method
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: fileType, //image or video
            invalidate: true, // Ensures CDN cache is also cleared
            type: "upload",
        });

        console.log("File deleted from Cloudinary:", result);
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
    }
}

// async function test() {
//     cloudinary.config({
//         cloud_name: "dvsrz6mfy",
//         api_key: process.env.CLOUDINARY_API_KEY,
//         api_secret: process.env.CLOUDINARY_API_SECRET,
//         secure: true,
//     });

//     await cloudinary.uploader.destroy("burma-tasty-house/xtxhrmchtuybvr8b5fdd", {
//         resource_type: "video", //image or video
//         invalidate: true, // Ensures CDN cache is also cleared
//         type: "upload",
//     });
//     console.log("done");
// }

// test();

export default deleteFileFromCloudinary;
