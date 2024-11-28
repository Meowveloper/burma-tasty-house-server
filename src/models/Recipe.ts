import mongoose, { Model, ObjectId, Schema } from "mongoose";
import IRecipe from "../types/IRecipe";
import User from "./User";
import { Request } from "express";
import IStep from "../types/IStep";
import Step from "../models/Step";
import { UploadedFile } from "express-fileupload";
import Tag from "./Tag";
import uploadFilesToCloudinary from "../helpers/uploadFilesToCloudinary";
import ITag from "../types/ITag";
import EnumCloudinaryFileTypes from "../types/EnumCloudinaryFileTypes";
import deleteFileFromCloudinary from "../helpers/deleteFileFromCloudinary";

interface IRecipeModel extends Model<IRecipe> {
    store: (req: Request) => IRecipe;
    update: (req: Request) => IRecipe;
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
    let uploadedFileUrls: Array<{ url: string; type: EnumCloudinaryFileTypes.image } | { url: string | null; type: EnumCloudinaryFileTypes.video }> = [];
    try {
        // Check if the recipe image is present in the request files
        if (!req.files?.image) throw new Error("Recipe image is required!!");

        // Extract the recipe image and video from the request files
        const recipeImage = req.files.image as UploadedFile;
        const recipeVideo = req.files?.video ? (req.files.video as UploadedFile) : undefined;

        // Upload the recipe image and video to Cloudinary
        const [imageCloudUrl, videoCloudUrl] = await Promise.all([uploadFilesToCloudinary(recipeImage, EnumCloudinaryFileTypes.image), uploadFilesToCloudinary(recipeVideo, EnumCloudinaryFileTypes.video)]);

        // Check if the video upload was successful
        if (recipeVideo && !videoCloudUrl) throw new Error("Error uploading video to Cloudinary");

        // Check if the image upload was successful
        if (!imageCloudUrl) throw new Error("Error uploading files to Cloudinary");

        // Add the image and video URLs to the uploadedFileUrls array for deletion if an error occurs
        uploadedFileUrls.push({ url: imageCloudUrl, type: EnumCloudinaryFileTypes.image }, { url: videoCloudUrl, type: EnumCloudinaryFileTypes.video });

        // Create a new recipe document with image and video urls
        const recipe: IRecipe = new Recipe({
            ...req.body,
            image: imageCloudUrl,
            video: videoCloudUrl ? videoCloudUrl : undefined,
        });

        // Create the steps for the recipe using steps data from Request
        const steps = await Promise.all(
            req.body.steps.map(async (stepData: IStep) => {
                // Extract the each step image from the request files
                const stepImage = req.files![`step_image_${stepData.sequence_number}`] as UploadedFile;

                // Upload the step image to Cloudinary
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

        // Add the step image URLs to the uploadedFileUrls array for deletion if an error occurs
        const stepImageUrls = steps
            .filter((step: IStep) => step.image && typeof step.image === "string") // Ensures image is defined and is a string
            .map((step: IStep) => ({ url: step.image, type: EnumCloudinaryFileTypes.image }));
        uploadedFileUrls = [...uploadedFileUrls, ...stepImageUrls];

        // Save steps to the database
        await Step.insertMany(steps);
        recipe.steps = steps.map((step: IStep) => step._id);

        // Find existing tags and new tags
        const tagNames = Array.isArray(req.body.tags) ? req.body.tags.map((tag: any) => tag.trim().toLowerCase()) : req.body.tags.split(",").map((tag: string) => tag.trim().toLowerCase());
        let existingTags: Array<mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>> = await Tag.find({ name: { $in: tagNames } });
        let newTags: Array<mongoose.Document<unknown, {}, ITag> & ITag & Required<{ _id: Schema.Types.ObjectId }>> = tagNames.filter((name: any) => !existingTags.find(tag => tag.name === name)).map((name: any) => new Tag({ name, recipes: [recipe._id] }));

        // save recipe to database
        recipe.tags = [...existingTags, ...newTags].map(tag => tag._id);
        await recipe.save();

        // Save new tags to the database
        await Tag.insertMany(newTags);

        // update new tags
        if (existingTags.length) {
            const updateOps = existingTags.map(tag => ({
                updateOne: { filter: { _id: tag._id }, update: { $push: { recipes: recipe._id } } },
            }));
            await Tag.bulkWrite(updateOps);
        }

        // update user
        await User.findByIdAndUpdate(recipe.user, { $push: { recipes: recipe._id } }, { new: true });
        return recipe;
    } catch (e) {
        for (const { url, type } of uploadedFileUrls) {
            console.log("clean up");
            await deleteFileFromCloudinary(url, type);
        }
        console.log("Error in model", e);
        throw new Error((e as Error).message);
    } finally {
        console.log("finally clean up");
    }
};

RecipeSchema.statics.update = async function (req: Request) {
    try {
        const recipe : IRecipe = await this.findById(req.body._id);
        console.log('steps', req.body.steps);
        console.log('tags', req.body.tags, typeof req.body.tags);
        let imageUrlToBeUpdated : string | null = null;
        let videoUrlToBeUpdated : string | null = null;
        if(!recipe) throw new Error('recipe to be updated not found');
        if (req.files)
        {
            const image = req.files.image as UploadedFile;
            const video = req.files.video as UploadedFile; 
            const [ imageCloudUrl, videoCloudUrl ] = await Promise.all([uploadFilesToCloudinary(image, EnumCloudinaryFileTypes.image), uploadFilesToCloudinary(video, EnumCloudinaryFileTypes.video)]);
            imageUrlToBeUpdated = imageCloudUrl;
            videoUrlToBeUpdated = videoCloudUrl;
        }

        if (imageUrlToBeUpdated) {
            // await deleteFileFromCloudinary(recipe.image, EnumCloudinaryFileTypes.image);
            recipe.image = imageUrlToBeUpdated;
        }

        if (videoUrlToBeUpdated) {
            // await deleteFileFromCloudinary(recipe.video, EnumCloudinaryFileTypes.video);
            recipe.video = videoUrlToBeUpdated;
        }

        // Update steps
        const steps = await Promise.all(
            req.body.steps.map(async (step: any) => {
                if (Object.keys(step).includes('_id')) {
                    return step;
                } else {
                    let imageUrl : string | null = null;
                    console.log('new step', step);
                    const stepImage = req.files![`step_image_${step.sequence_number}`] as UploadedFile;
                    if(stepImage) {
                        imageUrl = await uploadFilesToCloudinary(stepImage, EnumCloudinaryFileTypes.image);
                        if(!imageUrl) throw new Error('step image upload failed');
                    }
                    const newStep = new Step({
                        ...step,
                        sequence_number: step.sequence_number,
                        image : imageUrl || undefined, 
                        recipe_id: recipe._id
                    });
                    await newStep.save();
                    return newStep;
                }
            })
        )

        //tags
        const newTags = req.body.tags.filter((tag: any) => !Object.keys(tag).includes('_id')).map((tag: any) => new Tag({ name: tag.name, recipes: [recipe._id] })); // if the tag has id, it is not new
        //if new tags create new tags in db
        console.log('new tags', newTags);

        Tag.insertMany(newTags);

        //insert new tags and old tags into recipe
        const oldTags = req.body.tags.filter((tag: any) => Object.keys(tag).includes('_id')).map((tag: any) => tag._id);
        recipe.tags = [...oldTags, ...newTags.map((tag: any) => tag._id)];

        recipe.title = req.body.title;
        recipe.description = req.body.description;
        recipe.ingredients = req.body.ingredients;
        recipe.steps = steps.map((step: any) => step._id);
        recipe.preparation_time = req.body.preparation_time;
        recipe.difficulty_level = req.body.difficulty_level;
        await recipe.save();
        return recipe;
    } catch (e) {
        console.log("Error in model", e);
        throw new Error((e as Error).message);
    }
};

const Recipe: IRecipeModel = mongoose.model<IRecipe, IRecipeModel>("Recipe", RecipeSchema);
export default Recipe;


async function deleteSteps(stepIds : Array<IStep['_id']>) {

}
