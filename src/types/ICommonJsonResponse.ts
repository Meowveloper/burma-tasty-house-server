interface ICommonJsonResponse<T> {
    data : T; 
    msg : string;
    token? : string;
}
export default ICommonJsonResponse;