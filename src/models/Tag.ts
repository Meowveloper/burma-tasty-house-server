import mongoose, { Model, Schema } from "mongoose";
import ITag from "../types/ITag";

interface ITagModel extends Model<ITag> {

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
});

const Tag : ITagModel = mongoose.model<ITag, ITagModel>('Tag', TagSchema);
export default Tag;

