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
    try {
        if (!req.files?.image) throw new Error("Recipe image is required!!");
        console.log(req.files.image); 
        const recipeImage = req.files.image as UploadedFile;
        const recipeVideo = req.files.video as UploadedFile;
        const imageFileName = uploadFile(recipeImage, EnumFileTypes.Image);

        uploadFilesToCloudinary(imageFileName);

        const recipe: IRecipe = new Recipe({
            ...req.body,
            image: imageFileName,
            video: uploadFile(recipeVideo, EnumFileTypes.Video),
        });

        const stepsData = req.body.steps;
        const steps: Array<IStep["_id"]> = [];

        for (let i = 0; i < stepsData.length; i++) {
            const stepData = stepsData[i];
            const stepImage = req.files[`step_image_${stepData.sequence_number}`] as UploadedFile;

            const stepInstance = new Step({
                recipe_id: recipe._id,
                description: stepData.description,
                sequence_number: stepData.sequence_number,
                image: uploadFile(stepImage, EnumFileTypes.StepImage),
            });
            await stepInstance.save();
            steps.push(stepInstance._id);
        }

        const tagsToStoreInRecipe: Array<mongoose.Schema.Types.ObjectId> = [];
        if (req.body.tags) {
            for (const item of req.body.tags) {
                // Use for...of for async processing
                const name = item.trim().replace(/\s+/g, " ").toLowerCase();
                const existingTag = await Tag.findOne({ name: name });

                if (existingTag) {
                    existingTag.recipes?.push(recipe._id);
                    await existingTag.save();
                    tagsToStoreInRecipe.push(existingTag._id);
                } else {
                    const newTag = new Tag({
                        name: name,
                        recipes: [recipe._id],
                    });
                    await newTag.save();
                    tagsToStoreInRecipe.push(newTag._id);
                }
            }
        }
        recipe.steps = steps;
        recipe.tags = tagsToStoreInRecipe;
        await recipe.validate();
        await recipe.save();
        await User.findByIdAndUpdate(recipe.user, { $push: { recipes: recipe._id } }, { new: true });

        return recipe;
    } catch (e) {
        console.log("Error in model", e);
    }
};

const Recipe: IRecipeModel = mongoose.model<IRecipe, IRecipeModel>("Recipe", RecipeSchema);
export default Recipe;
