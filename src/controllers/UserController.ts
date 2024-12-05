import { Request, Response } from "express";
import User from "../models/User";
import IUser from "../types/IUser";
import ICommonJsonResponse from "../types/ICommonJsonResponse";
import ICommonError from "../types/ICommonError";
import EnumErrorNames from "../types/EnumErrorNames";
import { setHTTPOnlyToken, removeToken } from "../helpers/token";
import getUserFromToken from "../helpers/getUserFromToken";
import mongoose from "mongoose";
import IRecipe from "../types/IRecipe";
require("dotenv/config");
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
            if (!password) {
                const error = new Error();
                error.message = "password is required";
                error.name = EnumErrorNames.RegisterUserExists;
                throw error;
            }
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

    googleAuth: async function (req: Request, res: Response) {
        console.log("google", req);
        try {
            const { name, email, avatar, role = false } = req.body;
            const user = await User.findOne({ email: email });
            if (user) {
                const token: string = setHTTPOnlyToken(user._id, res);
                const jsonResponse: ICommonJsonResponse<IUser> = {
                    data: user,
                    msg: "Successfully logged in",
                    token: token,
                };
                return res.status(200).send(jsonResponse);
            } else {
                const newUser = new User({ name, email, avatar, role });
                const token: string = setHTTPOnlyToken(newUser._id, res);
                await newUser.save();
                const jsonResponse: ICommonJsonResponse<IUser> = {
                    data: newUser,
                    msg: "Successfully registered",
                    token: token,
                };
                return res.status(200).send(jsonResponse);
            }
        } catch (e) {
            console.log(e);
            let msg: string;
            if ((e as Error).name === EnumErrorNames.RegisterUserExists) {
                msg = (e as Error).message;
            } else {
                msg = "Unknown error occurred";
            }
            const jsonError: ICommonError<string> = {
                type: "google login error",
                location: "/api/users/google-auth",
                msg: msg,
                path: "/api/users/google-auth",
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
                        { path: "user", model: "User" },
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
        const token = removeToken(res);
        const jsonResponse: ICommonJsonResponse<null> = {
            data: null,
            msg: "logged out",
            token: token,
        };
        return res.status(200).send(jsonResponse);
    },


    addFollowings : async function (req : Request, res : Response) {
        try {
            const { followed, follower } = req.body;

            await User.addFollowings(followed, follower);

            const jsonResponse : ICommonJsonResponse<null> = {
                data : null,
                msg : "Successfully added followings",
            };
            
            return res.status(200).send(jsonResponse);
        } catch (e) {
            console.log(e);
            const jsonError : ICommonError<string> = {
                type : "add followings error",
                location : "/api/users/add-followings",
                msg : (e as Error).message,
                path : "/api/users/add-followings",
                value : (e as Error).message,
            };
            return res.status(500).send({
                errors : {
                    user : jsonError,
                },
            });
        }
    },

    removeFollowings : async function (req : Request, res : Response) {
        try {
            const { followed, follower } = req.body;

            await User.removeFollowings(followed, follower);

            const jsonResponse : ICommonJsonResponse<null> = {
                data : null,
                msg : "Successfully removed followings",
            };

            return res.status(200).send(jsonResponse);
        } catch (e) {
            console.log(e);
            const jsonError : ICommonError<string> = {
                type : "remove followings error",
                location : "/api/users/remove-followings",
                msg : (e as Error).message,
                path : "/api/users/remove-followings",
                value : (e as Error).message,
            };
            return res.status(500).send({
                errors : {
                    user : jsonError,
                },
            });
        }
    }
    
};

export default UserController;
