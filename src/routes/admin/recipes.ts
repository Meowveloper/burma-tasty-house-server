import express from 'express';
import AdminRecipeController from '../../controllers/admin/RecipeController';

const adminRecipeRoutes = express.Router();

adminRecipeRoutes.delete('', AdminRecipeController.destroy);

export default adminRecipeRoutes;