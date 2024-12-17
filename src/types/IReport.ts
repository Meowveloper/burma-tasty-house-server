import IComment from "./IComment";
import IRecipe from "./IRecipe";
import mongoose from "mongoose";
interface IReport {
    _id? : mongoose.Schema.Types.ObjectId;
    recipe : IRecipe['_id'];
    comment : IComment['_id'];
    body : string;
    createdAt? : Date;
    updatedAt? : Date;
}


export default IReport;