import { send_error_response, send_response, throw_error_if_not_authenticated_for_admin } from "../../helpers/generalHelpers";
import { Request, Response } from "express";
import Comment from "../../models/Comment";
const AdminCommentController = {
    destroy: async (req : Request, res : Response) => {
        throw_error_if_not_authenticated_for_admin(req, res);
        try {
            // get comment id
            const comment_id = req.query.comment_id;
            if(!comment_id) throw new Error('comment not found');

            // delete comment
            await Comment.findByIdAndDelete(comment_id);

            // send response
            send_response(null, "Successfully deleted comment", res);
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/comments", "destroy", res);
        }
    }
};

export default AdminCommentController;
