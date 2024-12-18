import Recipe from "../../models/Recipe";
import User from "../../models/User";
import Comment from "../../models/Comment";
import Report from "../../models/Report";
import { Request, Response } from "express";
import { send_error_response, send_response } from "../../helpers/generalHelpers";
import IRecipe from "@/src/types/IRecipe";

const AdminGeneralController = {
    statistics: async (req: Request, res: Response) => {
        try {
            const total_recipes = await count_recipes();

            const total_users = await count_users();

            const total_comments = await count_comments();

            const total_reports = await count_reports();

            send_response(
                {
                    total_recipes,
                    total_users,
                    total_comments,
                    total_reports
                },
                "Successfully fetched statistics",
                res
            );
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/statistics", "statistics", res); 
        }
    },

    get_latest_5_recipes_images : async (req : Request, res : Response) => {
        try {
            const images = await get_image_array_of_latest_recipes(5);
            send_response(
                images,
                "Successfully fetched latest 5 recipes images",
                res
            );

        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/get_latest_5_recipes_images", "get_latest_5_recipes_images", res);
        }
    }
    
};


export default AdminGeneralController;

async function count_recipes(): Promise<number> {
    try {
        const count = await Recipe.countDocuments();
        return count;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function count_users(): Promise<number> {
    try {
        const count = await User.countDocuments();
        return count;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function count_comments(): Promise<number> {
    try {
        const count = await Comment.countDocuments();
        return count;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function count_reports(): Promise<number> {
    try {
        const count = await Report.countDocuments();
        return count;
    } catch (e) {
        console.log(e);
        return 0;
    }
}

async function get_image_array_of_latest_recipes (limit : number) : Promise<Array<string | undefined>> {
    try {
        const recipes = await Recipe.find().sort({ createdAt: -1 }).limit(limit).select("image");
        return recipes.map((recipe : Partial<IRecipe>) => {
            if(recipe.image) return recipe.image;
            else return undefined;
        });
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

