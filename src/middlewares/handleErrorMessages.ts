import { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export function handleErrorMessage (req : Request, res : Response, next : NextFunction)
{
    const result = validationResult(req);
    if(!result.isEmpty()) return res.status(400).send({ errors : result.mapped() })
    else next();
}