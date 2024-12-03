import mongoose, { Model, Schema } from "mongoose";
import IComment from "../types/IComment";

interface CommentModel extends Model<IComment>{
    store_with_socket : (data : IComment) => Promise<IComment>
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

CommentSchema.statics.store_with_socket = async function(data : IComment) : Promise<IComment> {
    const comment = await this.create(data);

    if(comment) {
        if(comment.recipe) {
            await addCommentToRecipe(comment.recipe, comment._id);
        }

        if(comment.user) {
           comment.user =  await addCommentToUser(comment.user, comment._id);
        }
    }

    return comment;
}

const Comment : CommentModel = mongoose.model<IComment, CommentModel>("Comment", CommentSchema);

export default Comment;


async function addCommentToRecipe(recipeId : mongoose.Schema.Types.ObjectId, commentId : mongoose.Schema.Types.ObjectId) {
    try {
        const recipe = await mongoose.model("Recipe").findById(recipeId);
        if(recipe) {
            recipe.comments.push(commentId);
            await recipe.save();
        }
    } catch (e) {
        console.log(e);
    }
}

async function addCommentToUser(userId : mongoose.Schema.Types.ObjectId, commentId : mongoose.Schema.Types.ObjectId) {
    try {
        const user = await mongoose.model("User").findById(userId);
        if(user) {
            user.comments.push(commentId);
            await user.save();
            return user;
        }
    } catch (e) {
        console.log(e);
    }
}