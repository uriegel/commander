static class ErrorType
{
    public const string Unknown = "UNKNOWN";
    public const string AccessDenied = "ACCESS_DENIED";
    public const string PathNotFound = "PATH_NOT_FOUND";
    public const string TrashNotPossible = "TRASH_NOT_POSSIBLE";
    public const string Cancelled = "CANCELLED";
    public const string FileExists = "FILE_EXISTS";
    public const string WrongCredentials = "WRONG_CREDENTIALS";
    public const string NetworkNameNotFound = "NETWORK_NAME_NOT_FOUND";
    public const string NetworkPathNotFound = "NETWORK_PATH_NOT_FOUND";
}

record SystemError(string Error, string Message);


