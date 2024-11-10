import { Response } from "express";
import jwt from 'jsonwebtoken';
import 'dotenv/config';
import { ObjectId } from "mongoose";

export function generateToken (_id : ObjectId) : string {
    const maxAge = 3 * 24 * 60 * 60; // 3 days in seconds
    const jwtSecretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign({ _id }, jwtSecretKey!, { expiresIn : maxAge});
}

export function setHTTPOnlyToken (_id : ObjectId, res : Response) : string {
    const maxAgeForCookie = 3 * 24 * 60 * 60 * 1000; // 3 days in mili-seconds
    const token = generateToken(_id);
    res.cookie('token', token, { httpOnly : true, maxAge : maxAgeForCookie });
    return token;
}