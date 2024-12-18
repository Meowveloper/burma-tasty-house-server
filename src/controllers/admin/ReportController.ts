import { Request, Response } from "express";
import Report from "../../models/Report";
import { send_response, send_error_response, throw_error_if_not_authenticated_for_admin } from "../../helpers/generalHelpers";
import { IPagination } from "../../types/ICommonJsonResponse";
import { Query } from "mongoose";
const AdminReportController = {
    report_with_pagination: async function (req: Request, res: Response) {
        throw_error_if_not_authenticated_for_admin(req, res);
        try {
            const { limit, page } = get_page_and_limit_from_request(req);

            const query = Report.find().populate("comment").populate({
                path : "recipe", 
                populate : [
                    { path : "user" , model : "User" },
                    { path : "tags" , model : "Tag" }, 
                    { path : "steps", model : "Step" }
                ]
            });

            const reports = await get_paginated_documents_from_mongo_db(query, page, limit, "createdAt");

            const pagination = await get_pagination(Report.countDocuments(), page, limit);

            send_response(reports, "Successfully fetched reports", res, pagination);
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/reports", "report_with_pagination", res);
        }
    },

    show : async function (req : Request, res : Response) {
        throw_error_if_not_authenticated_for_admin(req, res);
        try {
            const report_id = req.query.report_id;
            if(!report_id) throw new Error('report not found');
            const report = await Report.findById(report_id).populate("comment").populate({
                path : "recipe", 
                populate : [
                    { path : "user" , model : "User" },
                    { path : "tags" , model : "Tag" }, 
                    { path : "steps", model : "Step" }
                ]
            });
            if(!report) throw new Error('report not found');

            send_response(report, "Successfully fetched report", res);
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/reports", "show", res);
        }
    }, 

    destroy : async function (req : Request, res : Response) {
        throw_error_if_not_authenticated_for_admin(req, res);
        try {
            const report_id = req.query.report_id;
            if(!report_id) throw new Error('report not found');
            await Report.findByIdAndDelete(report_id);
            send_response(null, "Successfully deleted report", res);
        } catch (e) {
            send_error_response(null, e as Error, "/api/admin/reports", "destroy", res);
        }
    }
};

export default AdminReportController;

function get_page_and_limit_from_request(req: Request): { limit: number; page: number } {
    try {
        const limit = req.query.limit ? Number(req.query.limit) : 5;

        // get page from request queries
        const page = req.query.page ? Number(req.query.page) : 1;

        return { limit, page };
    } catch (e) {
        console.log(e);
        return { limit: 5, page: 1 };
    }
    // get limit from request queries
}

async function get_paginated_documents_from_mongo_db<T>(query: Query<T[], T>, page: number, limit: number, sort: string): Promise<T[]> {
    try {
        const skip = (page - 1) * limit;
        const result = await query
            .sort({ [sort]: -1 })
            .skip(skip)
            .limit(limit);
        return result;
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}

async function get_pagination <T>(query: Query<number, T>, page : number, limit : number) : Promise<IPagination> {
    try {
        const total = await query.exec();
        const pagination : IPagination = {
            page : page, 
            total : total, 
            limit : limit, 
            totalPages : Math.ceil(total / limit)
        }
        return pagination;
    } catch (e) {
        console.log(e);
        throw new Error((e as Error).message);
    }
}
