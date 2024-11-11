import mongoose, { Model, ObjectId, Schema } from "mongoose";
import IRecipe from "../types/IRecipe";
import User from "./User";
import { Request } from "express";
import IStep from "../types/IStep";
import Step from "../models/Step";
import { UploadedFile } from "express-fileupload";
import uploadFile from "../helpers/uploadFile";
import EnumFileTypes from "../types/EnumFileTypes";
import Tag from "./Tag";
import uploadFilesToCloudinary from "../helpers/uploadFilesToCloudinary";
import deleteFile from "../helpers/deleteFile";
import path from "path";
import ITag from "../types/ITag";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import deleteFileFromCloudinary from "../helpers/deleteFileFromCloudinary";

interface IRecipeModel extends Model<IRecipe> {
    store: (req: Request) => IRecipe;
}

const RecipeSchema = new Schema<IRecipe>(
    {
        title: {
            type: String,
            required: [true, "title is required"],
        },
        image: {
            type: String,
            required: true,
        },
        video: {
            type: String,
            required: false,
            default: null,
        },
        description: {
            type: String,
            required: true,
        },
        preparation_time: {
            type: Number,
            required: true,
            min: [3, "Too Short Preparation Time"],
        },
        difficulty_level: {
            type: Number,
            required: true,
            min: [1, "difficulty level must be between 1 and 5"],
            max: [10, "difficulty level must be between 1 and 5"],
        },
        ingredients: {
            type: [String],
            required: true,
        },
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        views: {
            type: Number,
            default: 0,
        },
        steps: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Step",
            required: false,
        },
        tags: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: "Tag",
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

RecipeSchema.statics.store = async function (req: Request): Promise<IRecipe | void> {
    let uploadedFileUrls: Array<{ url : string, type : EnumCloudinaryFileTypes }> = [];
    try {
        if (!req.files?.image) throw new Error("Recipe image is required!!");
        const recipeImage = req.files.image as UploadedFile;
        const recipeVideo = req.files.video as UploadedFile;
        const imageFileName = uploadFile(recipeImage, EnumFileTypes.Image);
        const videoFileName = uploadFile(recipeVideo, EnumFileTypes.Video);

        const imageCloudUrl: string | null = await uploadFilesToCloudinary(imageFileName, EnumCloudinaryFileTypes.image);
        if (!imageCloudUrl) {
            deleteFile(path.join(__dirname, "../../public", imageFileName));
            throw new Error("error uploading image to cloudinary");
        }
        const videoCloudUrl: string | null = await uploadFilesToCloudinary(videoFileName, EnumCloudinaryFileTypes.video);
        if (!videoCloudUrl) {
            deleteFile(path.join(__dirname, "../../public", videoFileName));
            throw new Error("error uploading video to cloudinary");
        }
        uploadedFileUrls.push({ url : imageCloudUrl, type : EnumCloudinaryFileTypes.image }, { url : videoCloudUrl, type : EnumCloudinaryFileTypes.video });

        const recipe: IRecipe = new Recipe({
            ...req.body,
            image: imageCloudUrl,
            video: videoCloudUrl,
        });

        deleteFile(path.join(__dirname, "../../public", imageFileName));
        deleteFile(path.join(__dirname, "../../public", videoFileName));

        const stepsData = req.body.steps;
        const steps: Array<mongoose.Document<unknown, {}, IStep> & IStep & Required<{ _id: Schema.Types.ObjectId }>> = [];

        for (let i = 0; i < stepsData.length; i++) {
            const stepData = stepsData[i];
            const stepImage = req.files[`step_image_${stepData.sequence_number}`] as UploadedFile;
            let stepInstance;
            if (stepImage) {
                const stepImageName = uploadFile(stepImage, EnumFileTypes.StepImage);
                const stepImageCloudUrl = await uploadFilesToCloudinary(stepImageName, EnumCloudinaryFileTypes.image);
                if (!stepImageCloudUrl) {
                    deleteFile(path.join(__dirname, "../../public", stepImageName));
                    throw new Error("Error uploading step image to Cloudinary");
                }

                uploadedFileUrls.push({ url : stepImageCloudUrl, type : EnumCloudinaryFileTypes.image });

                stepInstance = new Step({
                    recipe_id: recipe._id,
                    description: stepData.description,
                    sequence_number: stepData.sequence_number,
                    image: stepImageCloudUrl,
                });

                deleteFile(path.join(__dirname, "../../public", stepImageName));
            } else {
                stepInstance = new Step({
                    recipe_id: recipe._id,
                    description: stepData.description,
                    sequence_number: stepData.sequence_number,
                });
            }
            steps.push(stepInstance);
        }

        const tagsToStoreInRecipe: Array<mongoose.Schema.Types.ObjectId> = [];
        let existingTags: Array<(mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>)> = [];
        let newTags: Array<mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>> = [];
        if (req.body.tags) {
            for (const item of req.body.tags) {
                // Use for...of for async processing
                const name = item.trim().replace(/\s+/g, " ").toLowerCase();
                const existingTag = await Tag.findOne({ name: name });

                if (existingTag) {
                    existingTag.recipes ? existingTag.recipes.push(recipe._id) : (existingTag.recipes = [recipe._id]);
                    existingTags.push(existingTag);
                    tagsToStoreInRecipe.push(existingTag._id);
                } else {
                    const newTag = new Tag({
                        name: name,
                        recipes: [recipe._id],
                    });
                    newTags.push(newTag);
                    tagsToStoreInRecipe.push(newTag._id);
                }
            }
        }

        for (const step of steps) {
            await step.save();
        }

        recipe.steps = steps.map(item => item._id);
        recipe.tags = tagsToStoreInRecipe;
        await recipe.validate();
        await recipe.save();
        if (existingTags.length) {
            for(const existingTag of existingTags) { await existingTag.save(); };
        } 
        for (const tag of newTags) {
            await tag.save();
        }
        await User.findByIdAndUpdate(recipe.user, { $push: { recipes: recipe._id } }, { new: true });
        return recipe;
    } catch (e) {
        for (const { url, type } of uploadedFileUrls) {
            await deleteFileFromCloudinary(url, type);
        }
        console.log("Error in model", e);
    }
};

const Recipe: IRecipeModel = mongoose.model<IRecipe, IRecipeModel>("Recipe", RecipeSchema);
export default Recipe;
