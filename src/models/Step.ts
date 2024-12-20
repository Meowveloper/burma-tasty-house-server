import mongoose, { Document, Model, Schema } from "mongoose"
import IStep from "../types/IStep";

interface IStepModel extends Model<IStep> {
    deleteMultipleSteps : (stepIds : mongoose.Schema.Types.ObjectId[]) => Promise<void>
}
const StepSchema : mongoose.Schema<IStep> = new Schema<IStep>({
    recipe_id : {
        type : mongoose.Schema.Types.ObjectId, 
        required : [true, 'recipe id is required']
    }, 
    description : {
        type : String, 
        required : [true, 'description is required']
    }, 
    image : {
        type : String, 
        required : false
    }, 
    sequence_number : {
        type : Number, 
        required : [true, 'sequence number is necessary'], 
        min : [1, 'at least one step must contain'], 
        max : [15, 'not more than 15 steps']
    }, 
    
}, 
{
    timestamps : true
});

StepSchema.statics.deleteMultipleSteps = async function (stepIds : mongoose.Schema.Types.ObjectId[]) {
    await this.deleteMany({ _id : { $in : stepIds } });
}

const Step : IStepModel = mongoose.model<IStep, IStepModel>('Step', StepSchema);
export default Step;