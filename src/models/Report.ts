import mongoose from "mongoose";
import IReport from "../types/IReport";

interface IReportModal {
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
    }
}, { timestamps : true });

ReportSchema.statics.store = async function (body : string, recipeId : mongoose.Schema.Types.ObjectId, commentId : mongoose.Schema.Types.ObjectId | null = null) : Promise<IReport>{
    try {
        const report = new this({ body, recipe : recipeId, comment : commentId });
        await report.save();
        return report;
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}


const Report : IReportModal = mongoose.model<IReport, IReportModal>("Report", ReportSchema);


export default Report;