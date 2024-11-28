import Tag from "../models/Tag";
import { Request, Response } from "express";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import ICommonError from "../types/ICommonError";
import ITag from "../types/ITag";
const TagController = {
    deleteMultipleTags : async function (req : Request, res : Response) {
        try {
            const tagIds = req.body.data as Array<ITag['_id']>;
            const commonJsonResponse : ICommonJsonResponse<null> = {
               data : null, 
               msg : "Successfully deleted tags", 
            };

            if(tagIds.length > 0) {
                await Tag.deleteMultipleTags(tagIds);
            }

            return res.status(200).send(commonJsonResponse);
            
        } catch (error) {
            console.log(error);
            const errorRes : Partial<ICommonError<string>> = {
                path : "/api/tags/delete-multiple",
                type : "delete method",
                msg : "error deleting tags",
            };
            return res.status(500).send({
                errors : {
                    tag : errorRes
                }
            });
        }
    }, 

    removeRecipeFromMultipleTags : async function (req : Request, res : Response) {
        try {
            const tagIds = req.body.data as Array<ITag['_id']>;
            const recipeId = req.body.recipeId;
            const commonJsonResponse : ICommonJsonResponse<null> = {
               data : null, 
               msg : "Successfully removed recipe from tags", 
            };

            if(tagIds && tagIds.length > 0) {
                await Tag.removeRecipeFromMultipleTags(tagIds, recipeId);
            }
            return res.status(200).send(commonJsonResponse);
        } catch (error) {
            console.log(error);
            const errorRes : Partial<ICommonError<string>> = {
                path : "/api/tags/remove-recipe-from-multiple",
                type : "delete method",
                msg : "error removing recipe from tags",
            };
            return res.status(500).send({
                errors : {
                    tag : errorRes
                }
            });
        }
    }
};

export default TagController;