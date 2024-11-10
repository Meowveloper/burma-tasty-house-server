import { UploadedFile } from "express-fileupload";
import EnumFileTypes from "../types/EnumFileTypes";
import path from "path";

function uploadFile(theFile: UploadedFile, fileType: EnumFileTypes): string {
    const allowedExtensions = {
        [EnumFileTypes.Image]: /^(jpeg|jpg|png|gif|svg)$/i,
        [EnumFileTypes.Video]: /^(mp4)$/i,
        [EnumFileTypes.StepImage]: /^(jpeg|jpg|png|gif|svg)$/i,
    };

    const fileExtension = path.extname(theFile.name).slice(1).toLowerCase(); // Get the extension without the dot

    const isAllowedExtension = allowedExtensions[fileType].test(fileExtension);

    if (!isAllowedExtension) {
        if (fileType === EnumFileTypes.Image) throw new Error("Only image file types are allowed");
        if (fileType === EnumFileTypes.Video) throw new Error("Only video file types are allowed");
        if (fileType === EnumFileTypes.StepImage) throw new Error("Only image file types are allowed when uploading steps");
    }
    let filePrefix: string;
    if (fileType === EnumFileTypes.Image) filePrefix = "recipe-image-";
    else if (fileType === EnumFileTypes.Video) filePrefix = "recipe-video-";
    else if (fileType === EnumFileTypes.StepImage) filePrefix = "recipe-step-image-";
    else throw new Error("Error while uploading file");

    const fileName = filePrefix + new Date().getTime() + "-" + theFile.name;
    const filePath = path.join(__dirname, "../../public", fileName);

    theFile.mv(filePath, (err: any) => {
        if (err) throw new Error("error while uploading file!!");
    });

    return fileName;
}

export default uploadFile;
