// function extractPublicIdFromCloudinarySecureUrl(secureUrl: string): string {
//     // Remove the domain and Cloudinary folder structure
//     const urlParts = secureUrl.split('/');
//     const fileNameWithExtension = urlParts[urlParts.length - 1]; // "recipe-image-1633026940.jpg"
    
//     // Get the folder and filename parts to form the public_id
//     const folderPath = urlParts.slice(6, -1).join('/'); // "burma-tasty-house"
//     const fileNameWithoutExtension = fileNameWithExtension.split('.')[0]; // "recipe-image-1633026940"

//     // Recreate the public_id
//     return `${folderPath}/${fileNameWithoutExtension}`;
// }

function extractPublicIdFromCloudinarySecureUrl(secureUrl: string): string {
    try {
        // Parse the URL to handle different URL formats reliably
        const urlObject = new URL(secureUrl);
        
        // Split the pathname and remove empty segments
        const pathSegments = urlObject.pathname.split('/').filter(segment => segment.length > 0);
        
        // Typical Cloudinary URL structure:
        // [upload, v1234, folder1/folder2, filename.jpg]
        // We want to find the last two segments that represent the full path
        
        if (pathSegments.length < 2) {
            throw new Error('Invalid Cloudinary URL format');
        }
        
        // The last segment is the filename with extension
        const fileNameWithExtension = pathSegments[pathSegments.length - 1];
        
        // Remove the file extension
        const fileNameWithoutExtension = fileNameWithExtension.split('.')[0];
        
        // Identify the folder path (all segments except the last two)
        // The second to last segment typically contains version or initial folder
        const folderPath = pathSegments.slice(2, -1).join('/');
        
        // Combine folder path and filename to recreate public_id
        const publicId = folderPath 
            ? `${folderPath}/${fileNameWithoutExtension}` 
            : fileNameWithoutExtension;

        // ----------

        const pathParts = publicId.split('/');
        const uploadIndex = pathParts.indexOf('upload');

        if (uploadIndex === -1 || pathParts.length <= uploadIndex + 2) {
            throw new Error('Invalid Cloudinary URL format');
        }
        
        return pathParts.slice(uploadIndex + 2).join('/');
    } catch (error) {
        console.error('Error extracting public ID:', error);
        throw new Error('Unable to extract public ID from Cloudinary URL');
    }
}


export default extractPublicIdFromCloudinarySecureUrl;
