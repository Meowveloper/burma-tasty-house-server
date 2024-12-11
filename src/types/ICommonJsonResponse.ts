export interface IPagination { page : number, total : number, limit : number, totalPages : number }
interface ICommonJsonResponse<T> {
    data : T; 
    msg : string;
    token? : string;
    pagination? : IPagination
}
export default ICommonJsonResponse;