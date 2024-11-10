import express from 'express';
import RecipeController from '../controllers/RecipeController';

const recipesRoutes = express.Router();

recipesRoutes.get('', RecipeController.index);
recipesRoutes.get('/:_id', RecipeController.show);
recipesRoutes.post('', RecipeController.store);


export default recipesRoutes;