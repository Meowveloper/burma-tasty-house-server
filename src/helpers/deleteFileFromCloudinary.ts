import { v2 as cloudinary } from "cloudinary";
import path from "path";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import extractPublicIdFromCloudinarySecureUrl from "./extractPublicIdFromCloudinarySecureUrl";

async function deleteFileFromCloudinary(fileUrl: string | null, fileType : EnumCloudinaryFileTypes): Promise<void> {
    try {
        if (!fileUrl) return;
        // Extract the public_id from the URL
        const public_id = extractPublicIdFromCloudinarySecureUrl(fileUrl);
        // Call the destroy method
        const result = await cloudinary.uploader.destroy(public_id, {
            resource_type: fileType, //image or video
        });

        console.log("File deleted from Cloudinary:", result);
    } catch (error) {
        console.error("Error deleting file from Cloudinary:", error);
    }
}

export default deleteFileFromCloudinary;
