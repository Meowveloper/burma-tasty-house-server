function extractPublicIdFromCloudinarySecureUrl(secureUrl: string): string {
    // Remove the domain and Cloudinary folder structure
    const urlParts = secureUrl.split('/');
    const fileNameWithExtension = urlParts[urlParts.length - 1]; // "recipe-image-1633026940.jpg"
    
    // Get the folder and filename parts to form the public_id
    const folderPath = urlParts.slice(6, -1).join('/'); // "burma-tasty-house"
    const fileNameWithoutExtension = fileNameWithExtension.split('.')[0]; // "recipe-image-1633026940"

    // Recreate the public_id
    return `${folderPath}/${fileNameWithoutExtension}`;
}

export default extractPublicIdFromCloudinarySecureUrl;
