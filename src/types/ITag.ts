import mongoose, { Mongoose } from "mongoose";

interface ITag {
    _id : mongoose.Schema.Types.ObjectId;
    name : string;
    recipes? : Array<mongoose.Schema.Types.ObjectId>;
}
export default ITag;