import mongoose, { Document } from "mongoose";
import IUser from "./IUser";
import IStep from "./IStep";
import ITag from "./ITag";

interface IRecipe extends Document {
    _id : mongoose.Schema.Types.ObjectId;
    title : string;
    image : string;
    video : string;
    description : string;
    preparation_time : number;
    difficulty_level : number;
    ingredients : Array<string>;
    user : mongoose.Schema.Types.ObjectId | IUser;  
    views? : number;
    steps? : mongoose.Schema.Types.ObjectId[] | IStep[];
    tags? : mongoose.Schema.Types.ObjectId[] | ITag[];
    createdAt? : Date; 
    updatedAt? : Date;
}

export interface IRecipePopulatedWithUser extends IRecipe {
    user : IUser;
}
export interface IRecipePopulatedWithSteps extends IRecipe {
    steps? : IStep[]
}

export default IRecipe;
