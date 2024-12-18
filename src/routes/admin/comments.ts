import AdminCommentController from '../../controllers/admin/CommentController';
import express from 'express';

const adminCommentRoutes = express.Router();

adminCommentRoutes.delete('', AdminCommentController.destroy);

export default adminCommentRoutes;