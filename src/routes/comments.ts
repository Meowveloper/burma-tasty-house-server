import express from 'express';
import CommentController from '../controllers/CommentController';

const commentRoutes = express.Router();

commentRoutes.get('/:recipeId', CommentController.getAllCommentsForARecipe);


export default commentRoutes;