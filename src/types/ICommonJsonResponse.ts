interface ICommonJsonResponse<T> {
    data : T; 
    msg : string;
    token? : string;
    pagination? : { page : number, total : number, limit : number, totalPages : number }
}
export default ICommonJsonResponse;