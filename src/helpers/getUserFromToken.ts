import { Request } from "express";
import jwt, { JwtPayload, VerifyErrors } from "jsonwebtoken";
import IUser from "../types/IUser";
import User from "../models/User";

export default async function getUserFromToken (req : Request) : Promise<IUser | null>
{
    const token = req.cookies.token;
    if(!token) {
        throw new Error('token not found');
    }

    try {
        const decodedValue = jwt.verify(token, process.env.JWT_SECRET_KEY!) as JwtPayload;

        if(decodedValue && typeof decodedValue !== 'string' && '_id' in decodedValue) {
            const user : IUser | null = await User.findById(decodedValue._id);
            return user;
        }

        throw new Error('Invalid token');
    } catch (e : any) {
        throw new Error(e.message);
    }
}