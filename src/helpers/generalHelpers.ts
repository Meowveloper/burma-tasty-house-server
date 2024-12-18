import Step from "../models/Step";
import Tag from "../models/Tag";
import User from "../models/User";
import IStep from "../types/IStep";
import mongoose from "mongoose";
import ICommonJsonResponse, { IPagination } from "../types/ICommonJsonResponse";
import ICommonError from "../types/ICommonError";
import { Request, Response } from "express";
import getUserFromToken from "./getUserFromToken";
export async function deleteAllStepsFromRecipe (ids : Array<IStep['_id']>) : Promise<void>
{   try {
        await Step.deleteMany({ _id: { $in: ids } });
    } catch (e) {
        console.log(e);
       throw new Error((e as Error).message); 
    } 
}

export async function removeRecipeFromMultipleTags (tagIds : mongoose.Schema.Types.ObjectId[], recipeId : mongoose.Schema.Types.ObjectId) {
    try {
        await Tag.updateMany({ _id : { $in : tagIds } }, { $pull : { recipes : recipeId } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

export async function removeRecipeFromUserRecipes (userId : mongoose.Schema.Types.ObjectId, recipeId : mongoose.Schema.Types.ObjectId) {
    try {
        await User.updateOne({ _id : userId }, { $pull : { recipes : recipeId } });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

export async function send_response<T>(value: T, msg: string, res: Response, pagination? : IPagination) {
    const commonResponse: ICommonJsonResponse<T> = {
        data: value,
        msg: msg,
        pagination : pagination
    };
    return res.status(200).send(commonResponse);
}
export async function send_error_response<T>(value: T, e : Error, path: string, field: string, res: Response) {
    console.log(e.message);
    const err_response : ICommonError<T> = {
        type : "error",
        msg : e.message || 'unknown error occurred',
        value : value,
        path : path,
        location : path
    };

    return res.status(500).send({
        errors : {
            [field] : err_response
        }
    })
}


export async function throw_error_if_not_authenticated_for_admin(req : Request, res : Response) {
    try {
        // check token
        const token = req.cookies.token;
        if(!token) throw new Error('not authenticated');

        // check if user is admin
        const user = await getUserFromToken(req);
        if(!user || !user.role) throw new Error('not authenticated or not admin');


    } catch (e) {
        send_error_response(null, e as Error, "/api/admin", "throw_error_if_not_authenticated_for_admin", res);
    }

}