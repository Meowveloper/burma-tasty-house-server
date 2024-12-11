import { Request, Response } from "express";
import IRecipe from "../types/IRecipe";
import Recipe from "../models/Recipe";
import ICommonError from "../types/ICommonError";
import ICommonJsonResponse, { IPagination } from "../types/ICommonJsonResponse";
import getUserFromToken, { getUserIdFromToken } from "../helpers/getUserFromToken";
import User from "../models/User";
import { Schema } from "mongoose";
import ITag from "../types/ITag";
import Tag from "../models/Tag";
const limitForPagination = 10;

const RecipeController = {
    index: async function (req: Request, res: Response) {
        try {
            const recipes: IRecipe[] = await Recipe.find()
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ createdAt: -1 });
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
            const recipe: IRecipe | null = await Recipe.findById(req.params._id).populate([
                { path: "steps", model: "Step" },
                { path: "tags", model: "Tag" },
                { path: "user", model: "User" },
            ]);
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
        req.body.steps = req.body.steps.map((item: string) => JSON.parse(item));
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
                    recipe: errorRes,
                },
            });
        }
    },

    update: async function (req: Request, res: Response) {
        console.log("here", "here");
        try {
            console.log("tags ", req.body.tags);
            console.log("steps ", req.body.steps);
            req.body.steps = req.body.steps.map((item: string) => JSON.parse(item));
            req.body.tags = req.body.tags.map((item: string) => JSON.parse(item));
            console.log("tags parsed", req.body.tags);
            console.log("steps parsed", req.body.steps);
            const recipe: IRecipe = await Recipe.update(req);
            const resObject: ICommonJsonResponse<IRecipe> = {
                data: recipe,
                msg: "Successfully updated a recipe. id => " + recipe._id,
            };
            return res.status(200).send(resObject);
        } catch (e) {
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/:id",
                type: "put method",
                msg: "error updating recipe",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    sortWithPagination: async function (req: Request, res: Response) {
        const page = Number(req.params.page) || 1;
        try {
            const skip = (page - 1) * limitForPagination;
            const sort = getSortString(req);
            const needAuth: boolean = Boolean(Number(req.query.needAuth)) || false;
            console.log('tag', req.query.tag);
            const filteredTagId : string | null = req.query.tag ? String(req.query.tag) : null;
            const following_ids = await getUserFollowingIds(req);
            if (!following_ids) throw new Error("user not found");
            const recipesIdsOfTag = await getRecipesOfTag(filteredTagId);
            const query = needAuth ? Recipe.find({ user: { $in: following_ids } }) : (filteredTagId ? Recipe.find({ _id : { $in : recipesIdsOfTag }}) : Recipe.find());
            const totalRecipes = needAuth ? following_ids.length : (filteredTagId ? recipesIdsOfTag?.length || 0 : await Recipe.countDocuments());
            const totalPages = Math.ceil(totalRecipes / limitForPagination);
            const recipes = await query
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ [sort]: -1 })
                .skip(skip)
                .limit(limitForPagination);

            const resObject: ICommonJsonResponse<IRecipe[]> = {
                data: recipes,
                msg: "Successfully fetched latest recipes sorted with '" + sort + "'",
                pagination: {
                    page: page,
                    total: totalRecipes,
                    limit: limitForPagination,
                    totalPages: totalPages,
                },
            };
            return res.status(200).send(resObject);
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/latest-with-pagination/:page",
                type: "get method",
                msg: "error fetching latest recipes",
            };

            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    latestRecipesWithNumberLimit: async function (req: Request, res: Response) {
        const limit: number = req.query.limit ? Number(req.query.limit) : 5;
        try {
            const recipes: IRecipe[] = await Recipe.find()
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ createdAt: -1 })
                .limit(limit);

            if (recipes.length > 0) {
                const resObject: ICommonJsonResponse<IRecipe[]> = {
                    data: recipes,
                    msg: "Successfully fetched latest " + req.params.limit + " recipes",
                };
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/latest?limit=" + limit,
                type: "get method",
                msg: "error fetching latest recipes",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    highestViewRecipesWithNumberLimit: async function (req: Request, res: Response) {
        const limit: number = req.query.limit ? Number(req.query.limit) : 5;
        try {
            const recipes: IRecipe[] = await Recipe.find()
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ views: -1 })
                .limit(limit);

            if (recipes.length > 0) {
                const resObject: ICommonJsonResponse<IRecipe[]> = {
                    data: recipes,
                    msg: "Successfully fetched highest view " + req.params.limit + " recipes",
                };
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/highest-view?limit=" + limit,
                type: "get method",
                msg: "error fetching highest view recipes",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    highestCommentRecipesWithNumberLimit: async function (req: Request, res: Response) {
        const limit: number = req.query.limit ? Number(req.query.limit) : 5;
        try {
            const recipes: IRecipe[] = await Recipe.find()
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ comments: -1 })
                .limit(limit);

            if (recipes.length > 0) {
                const resObject: ICommonJsonResponse<IRecipe[]> = {
                    data: recipes,
                    msg: "Successfully fetched highest comment " + req.params.limit + " recipes",
                };
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/highest-comment?limit=" + limit,
                type: "get method",
                msg: "error fetching highest comment recipes",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    getRecipeOfPeopleYouFollowedWithNumberLimit: async (req: Request, res: Response) => {
        const limit = req.query.limit ? Number(req.query.limit) : 5;
        try {

            // get followings user-ids array
            const following_ids = await getUserFollowingIds(req);
            if (!following_ids) throw new Error("user not found");

            // get recipes of those following users
            const recipes = await Recipe.find({ user: { $in: following_ids } })
                .populate([
                    { path: "steps", model: "Step" },
                    { path: "tags", model: "Tag" },
                    { path: "user", model: "User" },
                ])
                .sort({ createdAt: -1 })
                .limit(limit);

            // make response
            if (recipes.length > 0) {
                const resObject: ICommonJsonResponse<IRecipe[]> = {
                    data: recipes,
                    msg: "Successfully fetched recipes of people you followed",
                };
                return res.status(200).send(resObject);
            } else {
                throw new Error("no recipes found");
            }
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/get-recipe-of-people-you-followed?limit=" + limit,
                type: "get method",
                msg: "error fetching recipes of people you followed",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    addOneView: async function (req: Request, res: Response) {
        const _id = req.query._id;
        try {
            if (!_id) throw new Error("recipe not found");
            const recipe = await Recipe.findOneAndUpdate({ _id: _id }, { $inc: { views: 1 } }, { new: true });
            if (!recipe) throw new Error("recipe not found");
            const resObject: ICommonJsonResponse<IRecipe> = {
                data: recipe,
                msg: "successfully added one view to the recipe",
            };
            return res.status(200).send(resObject);
        } catch (e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/add-one-view",
                type: "patch method",
                msg: "error adding one view to the recipe",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    destroy: async function (req: Request, res: Response) {
        try {
            const recipe: IRecipe = await Recipe.destroy(req);
            const resObject: ICommonJsonResponse<IRecipe> = {
                data: recipe,
                msg: "Successfully deleted a recipe. id => " + recipe._id,
            };
            return res.status(200).send(resObject);
        } catch (e) {
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/:id",
                type: "delete method",
                msg: "error deleting recipe",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    },

    getSavedRecipesOfTheLoginUser: async function (req: Request, res: Response) {
        try {
            const user = await getUserFromToken(req);
            const savedRecipes = user?.saves || [];
            const recipes = await Recipe.find({ _id: { $in: savedRecipes } }).populate([
                { path: "steps", model: "Step" },
                { path: "tags", model: "Tag" },
                { path: "user", model: "User" },
            ]);
            const resObject: ICommonJsonResponse<IRecipe[]> = {
                data: recipes,
                msg: "Successfully fetched saved recipes",
            };
            return res.status(200).send(resObject);
        } catch(e) {
            console.log(e);
            const errorRes: Partial<ICommonError<string>> = {
                path: "/api/recipes/saved",
            };
            return res.status(500).send({
                errors: {
                    recipe: errorRes,
                },
            });
        }
    }
};

function isStringOrStringArray(value: any): value is string | string[] {
    return typeof value === "string" || (Array.isArray(value) && value.every(item => typeof item === "string"));
}

function getSortString(req: Request): string {
    const sortValue = req.query.sort;
    if (isStringOrStringArray(sortValue)) {
        return Array.isArray(sortValue) ? sortValue[0] : sortValue || "createdAt";
    } else {
        return "createdAt";
    }
}

async function getUserFollowingIds(req: Request) : Promise<Schema.Types.ObjectId[] | undefined> {
    // get user id and find user
    const user_id = await getUserIdFromToken(req);
    console.log("user_id", user_id);
    if (!user_id) throw new Error("not authenticated");
    const user = await User.findById(user_id);

    // get followings user-ids array
    const following_ids = user?.followings;
    return following_ids;
}

async function getRecipesOfTag(tagId : string | null) : Promise<ITag['recipes']> {
    try {
        if (tagId) {
            const tag : ITag | null = await Tag.findById(tagId);
            if(!tag) throw new Error('tag not found');
            return tag.recipes;
        } else throw new Error('tag not found');
    } catch(e) {
        console.log(e);
        return [];
    }
}


export default RecipeController;
