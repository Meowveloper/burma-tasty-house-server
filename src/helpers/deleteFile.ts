import fs from "fs";
function deleteFile(filePath: string) {
    if (fs.existsSync(filePath)) {
        fs.unlink(filePath, err => {
            if (err) {
                console.error("Error deleting file:", err);
            }
        });
    } else {
        console.log(`File not found: ${filePath}`);
    }
}

export default deleteFile;
