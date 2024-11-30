import mongoose, { Model, Schema } from "mongoose";
import ITag from "../types/ITag";

interface ITagModel extends Model<ITag> {
    deleteMultipleTags : (tagIds : mongoose.Schema.Types.ObjectId[]) => Promise<void>;
    removeRecipeFromMultipleTags : (tagIds : mongoose.Schema.Types.ObjectId[], recipeId : mongoose.Schema.Types.ObjectId) => Promise<void>;
}

const TagSchema = new Schema<ITag>({
    name : {
        type : String, 
        required : true
    }, 
    recipes : {
        type : [mongoose.Schema.Types.ObjectId], 
        ref : "Recipe", 
        required : true
    }
}, { timestamps : true });

TagSchema.statics.deleteMultipleTags = async function (tagIds : mongoose.Schema.Types.ObjectId[]) {
    await this.deleteMany({ _id : { $in : tagIds } });
}

TagSchema.statics.removeRecipeFromMultipleTags = async function (tagIds : mongoose.Schema.Types.ObjectId[], recipeId : mongoose.Schema.Types.ObjectId) {
    await this.updateMany({ _id : { $in : tagIds } }, { $pull : { recipes : recipeId } });
}


const Tag : ITagModel = mongoose.model<ITag, ITagModel>('Tag', TagSchema);
export default Tag;

