import { Request, Response } from "express";
import Comment from "../models/Comment";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import IComment from "../types/IComment";
import ICommonError from "../types/ICommonError";
const CommentController = {
    getAllCommentsForARecipe : async (req : Request, res : Response) => {
        try {
            // fetch recipe id
            const recipeId = req.params.recipeId;
            if(!recipeId) throw new Error("recipe id not found");

            // find comments for the recipe
            const comments = await Comment.find({ recipe : recipeId }).populate("user"); 

            // send response
            const jsonResponse : ICommonJsonResponse<IComment[]> = {
                data : comments,
                msg : "Successfully fetched comments for recipe",
            }

            return res.status(200).send(jsonResponse);
        } catch (e) {
            console.log((e as Error).message);
            const errRes : Partial<ICommonError<string>> = {
                path : "/api/recipes/:recipeId/comments",
                type : "get method error",
                msg : "error fetching comments for recipe",
            }
            return res.status(500).send({
                errors : {
                    comment : errRes
                }
            });
        }
    },
};


export default CommentController;