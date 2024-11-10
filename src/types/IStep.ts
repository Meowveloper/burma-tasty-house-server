import mongoose from "mongoose";
interface IStep extends Document {
    _id : mongoose.Schema.Types.ObjectId;
    recipe_id : mongoose.Schema.Types.ObjectId;
    description : string;
    image : string;
    sequence_number : number;
}
export default IStep;