import { Request, Response } from "express"
import IStep from "../types/IStep";
import Step from "../models/Step";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import ICommonError from "../types/ICommonError";
const StepController = {
    deleteMultipleSteps : async function(req : Request, res : Response) {
        try {
            const stepIds = req.body.stepIds as Array<IStep['_id']>;
            await Step.deleteMultipleSteps(stepIds);

            const jsonResponse : ICommonJsonResponse<null> = {
                data : null,
                msg : "Successfully deleted steps",
            }

            return res.status(200).send(jsonResponse);
        } catch (e) {
           console.log(e);
           const errorRes : Partial<ICommonError<string>> = {
               path : "/api/steps/delete-multiple",
               type : "delete method",
               msg : "error deleting steps",
           } 
           return res.status(500).send({
               errors : {
                   step : errorRes
               }
           });
        }
    }
}
export default StepController;