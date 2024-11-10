import express, { Request, Response } from "express";
import UserController from "../controllers/UserController";
import { body } from "express-validator";
import { handleErrorMessage } from "../middlewares/handleErrorMessages";
const userRoutes = express.Router();

userRoutes.get('', UserController.index);
userRoutes.get('/me', UserController.me);
userRoutes.post('/login', UserController.login);
userRoutes.post('/register',[
    body('email').notEmpty().withMessage('email is required'), 
    body('name').notEmpty().withMessage('name is required'), 
    body('password').notEmpty().withMessage('password is required') 
], handleErrorMessage, UserController.register);

userRoutes.post('/logout', UserController.logout);

// userRoutes.get('/login/google', (req : Request, res : Response) => {
//     console.log('request', req);
//     console.log('response', res);
// })


export default userRoutes;