import { Request, Response } from "express";
import Report from "../models/Report";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import IReport from "../types/IReport";
import ICommonError from "../types/ICommonError";

const ReportController = {
    store : async function (req : Request, res : Response) {
        try {
            const { body, recipeId, commentId } = req.body;
            const report = await Report.store(body, recipeId, commentId ? commentId : null);
            const resObject : ICommonJsonResponse<IReport> = {
                data : report,
                msg : "Successfully created a report. id => " + report._id,
            };
            return res.status(200).send(resObject);
        } catch (e) {
            console.log(e);
            const errorRes : Partial<ICommonError<string>> = {
                path : "/api/reports",
                type : "post method",
                msg : "error creating report",
            };
            return res.status(500).send({
                errors : {
                    report : errorRes,
                },
            });
        }
    }
};



export default ReportController;