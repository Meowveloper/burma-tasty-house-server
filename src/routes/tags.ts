import express from 'express'
import TagController from '../controllers/TagController';
const tagRoutes = express.Router();

tagRoutes.get('', TagController.getAllTags);
tagRoutes.post('/delete-multiple', TagController.deleteMultipleTags);
tagRoutes.put('/remove-recipe-from-multiple', TagController.removeRecipeFromMultipleTags);


export default tagRoutes;