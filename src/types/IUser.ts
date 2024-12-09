import mongoose, { Document } from "mongoose"
import IRecipe from "./IRecipe";
interface IUser extends Document {
    _id : mongoose.Schema.Types.ObjectId; 
    name : string;
    email : string;
    password : string;
    avatar? : string;
    role : boolean;
    recipes? : mongoose.Schema.Types.ObjectId[] | IRecipe[]
    comments? : mongoose.Schema.Types.ObjectId[];
    followers? : mongoose.Schema.Types.ObjectId[];
    followings? : mongoose.Schema.Types.ObjectId[];
    saves? : mongoose.Schema.Types.ObjectId[];
    createdAt? : Date;
    updatedAt? : Date;
}

export interface IUserPopulatedWithRecipes extends IUser {
    recipes : IRecipe[]
}

export default IUser;