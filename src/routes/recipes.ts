import express, { Request, Response } from 'express';
import RecipeController from '../controllers/RecipeController';

const recipesRoutes = express.Router();

recipesRoutes.post('/hello-world', (req: Request, res : Response) => {
    console.log('req', req);
    return res.send('hello world');
})
// cannot change the order of these routes (lines of code) in order to get proper route matching
recipesRoutes.get('', RecipeController.index);
recipesRoutes.post('', RecipeController.store);
recipesRoutes.put('', RecipeController.update);
recipesRoutes.get('/saved', RecipeController.getSavedRecipesOfTheLoginUser);
recipesRoutes.get('/sort-with-pagination/:page', RecipeController.sortWithPagination);
recipesRoutes.get('/latest', RecipeController.latestRecipesWithNumberLimit);
recipesRoutes.get('/highest-view', RecipeController.highestViewRecipesWithNumberLimit);
recipesRoutes.get('/highest-comment', RecipeController.highestCommentRecipesWithNumberLimit);
recipesRoutes.get('/people-you-followed/latest', RecipeController.getRecipeOfPeopleYouFollowedWithNumberLimit);
recipesRoutes.get('/add-one-view', RecipeController.addOneView);
recipesRoutes.get('/:_id', RecipeController.show);
recipesRoutes.delete('/:_id', RecipeController.destroy);

export default recipesRoutes;