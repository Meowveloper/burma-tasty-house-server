import express from 'express';
import StepController from '../controllers/StepController';

const stepRoutes = express.Router();

stepRoutes.delete('delete-multiple-steps', StepController.deleteMultipleSteps);

export default stepRoutes;