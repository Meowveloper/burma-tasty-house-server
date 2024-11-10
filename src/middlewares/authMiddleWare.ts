import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import ICommonError from "../types/ICommonError";
import IUser from "../types/IUser";
import User from "../models/User";

export default function authMiddleWare(req: Request, res: Response, next: NextFunction) {
    const token = req.cookies.token;
    if (token)
    {
        jwt.verify(token, process.env.JWT_SECRET_KEY!, (err: VerifyErrors | null, decodedValue: string | JwtPayload | undefined) => {
            if (err)
            {

                const jsonError: ICommonError<VerifyErrors> = {
                    type: "authentication error",
                    path: "/api/users/me",
                    msg: "not authenticated",
                    value: err,
                    location: "/api/users/me",
                };
                return res.status(400).send({
                    errors : {
                        users : jsonError
                    }
                });

            }
            else if (decodedValue && typeof decodedValue !== "string" && "_id" in decodedValue)
            {
                User.findById(decodedValue._id).then((user: IUser | null) => {
                    if (user) req.user = user;
                    next();
                });
            }
        });
    }
    else
    {
        const jsonError: ICommonError<string> = {
            type: "authentication error",
            path: "/api/users/me",
            msg: "not authenticated",
            value: "no token",
            location: "/api/users/me",
        };
        return res.status(400).send({
            errors : {
                users : jsonError
            }
        });
    }
}
