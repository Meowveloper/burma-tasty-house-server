import express from 'express';
import ReportController from '../controllers/ReportController';
const reportRoutes = express.Router();

reportRoutes.post('', ReportController.store);

export default reportRoutes;