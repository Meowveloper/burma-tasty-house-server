import { Request, Response } from "express";
import User from "../models/User";
import IUser from "../types/IUser";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import ICommonError from "../types/ICommonError";
import EnumErrorNames from "../types/EnumErrorNames";
import { setHTTPOnlyToken } from "../helpers/token";
import getUserFromToken from "../helpers/getUserFromToken";
import mongoose from "mongoose";
import IRecipe from "../types/IRecipe";
const UserController = {
    me: async (req: Request, res: Response) => {
        try {
            const user: IUser | null = await getUserFromToken(req);
            if (user) {
                const token: string = setHTTPOnlyToken(user._id, res);
                const jsonResponse: ICommonJsonResponse<IUser> = {
                    data: user,
                    msg: "Authenticated",
                    token: token,
                };
                return res.status(200).send(jsonResponse);
            } else {
                throw new Error("User not found");
            }
        } catch (e) {
            const jsonError: ICommonError<string> = {
                type: "authentication error",
                path: "api/users/me",
                location: "api/users/me",
                msg: (e as Error).message,
                value: "authentication error",
            };
            return res.status(401).send(jsonError);
        }
    },

    login: async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user: IUser = await User.login(email, password);
            const token: string = setHTTPOnlyToken(user._id, res);
            const jsonResponse: ICommonJsonResponse<IUser> = {
                data: user,
                msg: "Successfully logged in",
                token: token,
            };

            return res.status(200).send(jsonResponse);
        } catch (e) {
            let msg: string;
            if ((e as Error).name === EnumErrorNames.LoginIncorrectPassword || (e as Error).name === EnumErrorNames.LoginUserDoesNotExist) {
                msg = (e as Error).message;
            } else {
                msg = "Unknown error occurred";
            }
            const jsonError: ICommonError<string> = {
                type: "login error",
                path: "/api/users/login",
                location: "/api/users/login",
                msg: msg,
                value: "login error",
            };
            return res.status(500).send({
                errors: {
                    user: jsonError,
                },
            });
        }
    },

    register: async (req: Request, res: Response) => {
        try {
            const { name, email, password, role = false } = req.body;
            const user: IUser = await User.register(name, email, password, role);
            const token: string = setHTTPOnlyToken(user._id, res);
            const jsonResponse: ICommonJsonResponse<IUser> = {
                data: user,
                msg: "Successfully registered",
                token: token,
            };
            return res.status(200).send(jsonResponse);
        } catch (e) {
            let msg: string;
            if ((e as Error).name === EnumErrorNames.RegisterUserExists) {
                msg = (e as Error).message;
            } else {
                msg = "Unknown error occurred";
            }
            const jsonError: ICommonError<string> = {
                type: "register error",
                location: "/api/users/register",
                msg: msg,
                path: "/api/users/register",
                value: msg,
            };
            return res.status(500).send({
                errors: {
                    user: jsonError,
                },
            });
        }
    },

    index: async function (req: Request, res: Response) {
        try {
            const users: IUser[] = await User.find().sort({ createdAt: -1 });
            const jsonResponse: ICommonJsonResponse<IUser[]> = {
                data: users,
                msg: "successfully fetched all users",
            };
            return res.status(200).send(jsonResponse);
        } catch (e) {
            const jsonError: Partial<ICommonError<string>> = {
                type: "get method error",
                path: "/api/users",
                msg: "Error getting users",
            };
            return res.status(500).send({
                errors: {
                    user: jsonError,
                },
            });
        }
    },

    getUserPopulatedWithRecipes: async function (req: Request, res: Response) {
        const userId = req.params.userId;
        console.log(userId);
        try {
            const userPopulatedWithRecipes = await User.findById(userId)
                .populate({
                    path: "recipes",
                    populate: [
                        { path: "steps", model: "Step" },
                        { path: "tags", model: "Tag" },
                        { path: "user", model : "User"}
                    ],
                })
                .then(user => {
                    if (user && user.recipes) {
                        // Sort recipes by 'updatedAt' field in descending order
                        user.recipes.sort((a, b) => {
                            return (b as IRecipe).updatedAt!.getTime() - (a as IRecipe).updatedAt!.getTime(); // latest first
                        });
                    }
                    return user;
                });
            if (!userPopulatedWithRecipes) throw new Error("user not found");
            const jsonResponse: ICommonJsonResponse<mongoose.Document<unknown, {}, IUser> & IUser & Required<{ _id: mongoose.Schema.Types.ObjectId }> & { __v: number }> = {
                data: userPopulatedWithRecipes,
                msg: "successfully fetched user populated with recipes",
            };
            return res.status(200).send(jsonResponse);
        } catch (e) {
            console.log(e);
            const jsonError: ICommonError<string> = {
                type: "register error",
                location: "/user-with-recipe/:userId",
                msg: (e as Error).message,
                path: "/user-with-recipe/:userId",
                value: (e as Error).message,
            };
            return res.status(404).send(jsonError);
        }
    },

    logout: async function (req: Request, res: Response) {
        res.cookie("token", "", { maxAge: 1 });
        const jsonResponse: ICommonJsonResponse<null> = {
            data: null,
            msg: "logged out",
        };
        return res.status(200).send(jsonResponse);
    },
};

export default UserController;
