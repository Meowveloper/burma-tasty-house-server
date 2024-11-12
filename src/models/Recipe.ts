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
    console.log("the files", req.files);
    let uploadedFileUrls: Array<{ url: string; type: EnumCloudinaryFileTypes }> = [];
    try {
        if (!req.files?.image) throw new Error("Recipe image is required!!");
        const recipeImage = req.files.image as UploadedFile;
        const recipeVideo = req.files.video as UploadedFile;

        const [imageCloudUrl, videoCloudUrl] = await Promise.all([uploadFilesToCloudinary(recipeImage, EnumCloudinaryFileTypes.image), uploadFilesToCloudinary(recipeVideo, EnumCloudinaryFileTypes.video)]);

        if (!imageCloudUrl || !videoCloudUrl) throw new Error("Error uploading files to Cloudinary");

        uploadedFileUrls.push({ url: imageCloudUrl, type: EnumCloudinaryFileTypes.image }, { url: videoCloudUrl, type: EnumCloudinaryFileTypes.video });

        const recipe: IRecipe = new Recipe({
            ...req.body,
            image: imageCloudUrl,
            video: videoCloudUrl,
        });

        const steps = await Promise.all(
            req.body.steps.map(async (stepData: IStep) => {
                const stepImage = req.files![`step_image_${stepData.sequence_number}`] as UploadedFile;
                console.log(`the step_image_${stepData.sequence_number}`, stepImage);

                let imageUrl: string | null = "";
                if (stepImage) {
                    // Wait for Cloudinary upload to complete and get the URL
                    imageUrl = await uploadFilesToCloudinary(stepImage, EnumCloudinaryFileTypes.image);
                    if (!imageUrl) throw new Error("error uploading step image");
                }

                // Create the step with the image URL, if available
                return new Step({
                    recipe_id: recipe._id,
                    description: stepData.description,
                    sequence_number: stepData.sequence_number,
                    image: imageUrl || undefined, // Assign URL or leave undefined if no image
                });
            })
        );

        const stepImageUrls = steps
            .filter((step: IStep) => step.image && typeof step.image === "string") // Ensures image is defined and is a string
            .map((step: IStep) => ({ url: step.image, type: EnumCloudinaryFileTypes.image }));
        uploadedFileUrls = [...uploadedFileUrls, ...stepImageUrls];

        await Step.insertMany(steps);
        recipe.steps = steps.map((step: IStep) => step._id);

        const tagNames = Array.isArray(req.body.tags) ? req.body.tags.map((tag: any) => tag.trim().toLowerCase()) : req.body.tags.split(",").map((tag: string) => tag.trim().toLowerCase());
        console.log('tag names', tagNames);
        let existingTags: Array<mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>> = await Tag.find({ name: { $in: tagNames } });
        let newTags: Array<mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>> = tagNames.filter((name: any) => !existingTags.find(tag => tag.name === name)).map((name: any) => new Tag({ name, recipes: [recipe._id] }));

        recipe.tags = [...existingTags, ...newTags].map(tag => tag._id);
        await recipe.save();

        await Tag.insertMany(newTags);
        if (existingTags.length) {
            const updateOps = existingTags.map(tag => ({
                updateOne: { filter: { _id: tag._id }, update: { $push: { recipes: recipe._id } } },
            }));
            await Tag.bulkWrite(updateOps);
        }

        await User.findByIdAndUpdate(recipe.user, { $push: { recipes: recipe._id } }, { new: true });
        return recipe;
    } catch (e) {
        for (const { url, type } of uploadedFileUrls) {
            console.log("clean up");
            await deleteFileFromCloudinary(url, type);
        }
        console.log("Error in model", e);
    } finally {
        console.log("finally clean up");
    }
};

const Recipe: IRecipeModel = mongoose.model<IRecipe, IRecipeModel>("Recipe", RecipeSchema);
export default Recipe;
