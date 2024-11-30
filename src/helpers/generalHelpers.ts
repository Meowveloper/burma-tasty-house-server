import Step from "../models/Step";
import Tag from "../models/Tag";
import User from "../models/User";
import IStep from "../types/IStep";
import mongoose from "mongoose";
export async function deleteAllStepsFromRecipe (ids : Array<IStep['_id']>) : Promise<void>
{   try {
        await Step.deleteMany({ _id: { $in: ids } });
    } catch (e) {
        console.log(e);
       throw new Error((e as Error).message); 
    } 
}

export async function removeRecipeFromMultipleTags (tagIds : mongoose.Schema.Types.ObjectId[], recipeId : mongoose.Schema.Types.ObjectId) {
    try {
        await Tag.updateMany({ _id : { $in : tagIds } }, { $pull : { recipes : recipeId } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

export async function removeRecipeFromUserRecipes (userId : mongoose.Schema.Types.ObjectId, recipeId : mongoose.Schema.Types.ObjectId) {
    try {
        await User.updateOne({ _id : userId }, { $pull : { recipes : recipeId } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}