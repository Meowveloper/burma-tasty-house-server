import express from 'express';
import StepController from '../controllers/StepController';

const stepRoutes = express.Router();

stepRoutes.post('/delete-multiple', StepController.deleteMultipleSteps);

export default stepRoutes;