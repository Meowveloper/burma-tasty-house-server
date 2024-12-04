import IRecipe from "./IRecipe";
import IUser from "./IUser";
import mongoose from "mongoose";
interface IComment {
    _id? : mongoose.Schema.Types.ObjectId;
    recipe : IRecipe['_id'];
    user : IUser['_id'];
    body : string, 
    replies? : Array<IComment['_id']> | Array<IComment>;
    createdAt? : Date;
    updatedAt? : Date;
}

export default IComment;

