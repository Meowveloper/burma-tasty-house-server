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

userRoutes.post('/google-auth', UserController.googleAuth);
userRoutes.post('/add-followings', UserController.addFollowings);
userRoutes.post('/remove-followings', UserController.removeFollowings);
userRoutes.get('/user-with-recipe/:userId', UserController.getUserPopulatedWithRecipes);

userRoutes.post('/logout', UserController.logout);



export default userRoutes;