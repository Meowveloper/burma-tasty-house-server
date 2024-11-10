import { Request, Response, NextFunction } from "express";
import mongoose from "mongoose";
import ICommonError from "../types/ICommonError";

function checkParamId(req: Request, res: Response, next: NextFunction) {
    const _id = req.params._id;
    if (!mongoose.Types.ObjectId.isValid(_id)) {
        const idInvalidError: ICommonError<string> = {
            type: "invalid id",
            location: req.path,
            msg: "invalid id type",
            path: req.path,
            value: _id,
        };
        return res.status(400).send({
            errors: {
                _id: idInvalidError,
            },
        });
    } else {
        next();
    }
}
