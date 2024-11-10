interface ICommonError<T> {
    type : string, 
    location : string, 
    msg : string, 
    path : string, 
    value : T
}
export default ICommonError;