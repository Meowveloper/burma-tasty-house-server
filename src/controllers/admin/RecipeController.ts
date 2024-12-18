import Recipe from "../../models/Recipe";
import { Request, Response } from "express";
import {
    throw_error_if_not_authenticated_for_admin,
    send_error_response,
    send_response
} from "../../helpers/generalHelpers";

const AdminRecipeController = {
    destroy: async function (req: Request, res: Response) {
        throw_error_if_not_authenticated_for_admin(req, res);
        try {
            // get recipe id
            const recipe_id = req.query.recipe_id;
            if(!recipe_id) throw new Error('recipe not found');

            // delete recipe 
            await Recipe.findByIdAndDelete(recipe_id);

            // send response 
            send_response(null, "Successfully deleted recipe", res);
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/recipes", "destroy", res);
        }
    }
};

export default AdminRecipeController;