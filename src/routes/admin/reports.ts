import AdminReportController from '../../controllers/admin/ReportController';
import express from 'express';
const adminReportRoutes = express.Router();

adminReportRoutes.get('/with_pagination', AdminReportController.report_with_pagination);
adminReportRoutes.get('/show', AdminReportController.show);

export default adminReportRoutes;