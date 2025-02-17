using CsTools.HttpRequest;

static class Error
{
    public static RequestError MapException(Exception e)
    => e switch
    {
        DirectoryNotFoundException => IOErrorType.PathNotFound.ToError(),
        IOException ioe when ioe.HResult == 13 => IOErrorType.AccessDenied.ToError(),
        IOException ioe when ioe.HResult == -2147024891 => IOErrorType.AccessDenied.ToError(),
        UnauthorizedAccessException => IOErrorType.AccessDenied.ToError(),
        _ => IOErrorType.Exn.ToError()
    };
}