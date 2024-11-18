import { Request, Response } from "express";
import IRecipe from "../types/IRecipe";
import Recipe from "../models/Recipe";
import ICommonError from "../types/ICommonError";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import { populate } from "dotenv";

const RecipeController = {
    index: async function (req: Request, res: Response) {
        try {
            const recipes: IRecipe[] = await Recipe.find().populate(
               [
                   { path: "steps", model: "Step" },
                   { path: "tags", model: "Tag" },
                   { path: "user", model : "User"}
               ] 
            ).sort({ createdAt: -1 });
            const resObject: ICommonJsonResponse<IRecipe[]> = {
                data: recipes,
                msg: "successfully fetched all recipes",
            };
            return res.status(200).send(resObject);
        } catch (e) {
            const errRes: Partial<ICommonError<string>> = {
                path: "api/recipes",
                type: "get method error",
                msg: "error fetch recipes",
            };
            return res.status(500).send({
                errors: {
                    recipe: errRes,
                },
            });
        }
    },

    show: async function (req: Request, res: Response) {
        try {
            const recipe: IRecipe | null = await Recipe.findById(req.params._id);
            if (recipe) {
                const resObject: ICommonJsonResponse<IRecipe> = {
                    data: recipe,
                    msg: "successfully fetched recipe => " + recipe.title,
                };
                return res.status(200).send(resObject);
            } else {
                throw new Error("recipe not found");
            }
        } catch (e) {
            console.log(e);
            const error: Partial<ICommonError<string>> = {
                path: "api/recipes/:id",
                type: "get method error",
                msg: "recipe not found please find with a valid ID type",
            };
            return res.status(404).send({
                errors: {
                    recipe: error,
                },
            });
        }
    },

    store: async function (req: Request, res: Response) {
        req.body.steps = req.body.steps.map((item : string) => JSON.parse(item));
        try {
            const recipe: IRecipe = await Recipe.store(req);
            // const recipeData
            const resObject: ICommonJsonResponse<IRecipe> = {
                data: recipe,
                msg: "Successfully created a recipe. id => " + recipe._id,
            };
            return res.status(200).send(resObject);
        } catch (e) {
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes",
                type: "post method",
                msg: "error creating recipe",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes
                }
            });
        }
    },
    
    latestRecipesWithNumberLimit : async function (req : Request, res : Response) {
        const limit : number = req.query.limit ? Number(req.query.limit) : 5;
        try {
            const recipes : IRecipe[] = await Recipe.find().populate(
                [
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model : "User" }
                ] 
            ).sort({ createdAt: -1 }).limit(limit);

            if(recipes.length > 0) {
                const resObject : ICommonJsonResponse<IRecipe[]> = {
                    data : recipes,
                    msg : "Successfully fetched latest " + req.params.limit + " recipes"
                }
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes : Partial<ICommonError<string>> = {
                path : "/api/recipes/latest?limit=" + limit,
                type : "get method",
                msg : "error fetching latest recipes",
            };
            return res.status(500).send({
                errors : {
                    recipe : errorRes
                }
            });
        }
    }, 

    highestViewRecipesWithNumberLimit : async function (req : Request, res : Response) {
        const limit : number = req.query.limit ? Number(req.query.limit) : 5;
        try {
            const recipes : IRecipe[] = await Recipe.find().populate(
                [
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model : "User" }
                ] 
            ).sort({ views: -1 }).limit(limit);

            if(recipes.length > 0) {
                const resObject : ICommonJsonResponse<IRecipe[]> = {
                    data : recipes,
                    msg : "Successfully fetched highest view " + req.params.limit + " recipes"
                }
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes : Partial<ICommonError<string>> = {
                path : "/api/recipes/highest-view?limit=" + limit,
                type : "get method",
                msg : "error fetching highest view recipes",
            };
            return res.status(500).send({
                errors : {
                    recipe : errorRes
                }
            });
        }
    }
};

export default RecipeController;
