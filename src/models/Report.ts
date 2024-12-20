import mongoose from "mongoose";
import IReport from "../types/IReport";

interface IReportModal extends mongoose.Model<IReport> {
    store : (body : string, recipeId : mongoose.Schema.Types.ObjectId, commentId : mongoose.Schema.Types.ObjectId | null) => Promise<IReport>    
}

const ReportSchema = new mongoose.Schema<IReport>({
    recipe : {
        type : mongoose.Schema.Types.ObjectId, 
        ref : "Recipe", 
        required : true
    }, 
    comment : {
        type : mongoose.Schema.Types.ObjectId, 
        ref : "Comment", 
        required : false
    }, 
    body : {
        type : String, 
        required : true
    }, 
    is_comment_report : {
        type : Boolean, 
        default : false
    }
}, { timestamps : true });

ReportSchema.statics.store = async function (body : string, recipeId : mongoose.Schema.Types.ObjectId, commentId : mongoose.Schema.Types.ObjectId | null = null) : Promise<IReport>{
    try {
        const report = new this({ body, recipe : recipeId, comment : commentId, is_comment_report : commentId ? true : false });
        await report.save();
        return report;
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}


const Report : IReportModal = mongoose.model<IReport, IReportModal>("Report", ReportSchema);


export default Report;