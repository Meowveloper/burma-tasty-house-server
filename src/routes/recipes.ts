import express from 'express';
import RecipeController from '../controllers/RecipeController';

const recipesRoutes = express.Router();

// cannot change the order of these routes (lines of code) in order to get proper route matching
recipesRoutes.get('', RecipeController.index);
recipesRoutes.post('', RecipeController.store);
recipesRoutes.put('', RecipeController.update);
recipesRoutes.get('/latest', RecipeController.latestRecipesWithNumberLimit);
recipesRoutes.get('/highest-view', RecipeController.highestViewRecipesWithNumberLimit);
recipesRoutes.get('/add-one-view', RecipeController.addOneView);
recipesRoutes.get('/:_id', RecipeController.show);

export default recipesRoutes;