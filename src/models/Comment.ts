import mongoose, { Model, Schema } from "mongoose";
import IComment from "../types/IComment";

interface CommentModel extends Model<IComment>{

}

const CommentSchema = new Schema<IComment>({
    recipe : {
        type : Schema.Types.ObjectId, 
        ref : "Recipe", 
        required : true
    }, 

    user : {
        type : Schema.Types.ObjectId, 
        ref : "User", 
        required : true
    }, 

    body : {
        type : String, 
        required : true
    }, 
    replies : {
        type : [Schema.Types.ObjectId], 
        ref : "Comment", 
        required : false,
        default : null
    }
});


const Comment : CommentModel = mongoose.model<IComment, CommentModel>("Comment", CommentSchema);

export default Comment;