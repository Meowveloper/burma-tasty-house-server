import AdminGeneralController from '../../controllers/admin/GeneralController';
import express from 'express';

const adminGeneralRoutes = express.Router();

adminGeneralRoutes.get('/statistics', AdminGeneralController.statistics);
adminGeneralRoutes.get('/get_latest_5_recipes_images', AdminGeneralController.get_latest_5_recipes_images);

export default adminGeneralRoutes;