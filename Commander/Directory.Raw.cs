using CsTools.Extensions;
using CsTools.Functional;
using CsTools.HttpRequest;
using static CsTools.Core;

static partial class Directory
{
    public static Result<Nothing, RequestError> Move(string path, string newPath)
        => Try(
            () => nothing.SideEffect(_ => System.IO.Directory.Move(path, newPath)),
            MapException);

    public static Result<Nothing, RequestError> CreateFolder(string name, string path)
        => Try(
            () => nothing.SideEffect(_ => System.IO.Directory.CreateDirectory(path.AppendPath(name))),
            MapException);

    static RequestError MapException(Exception e)
        => e switch
        {
            DirectoryNotFoundException                      => IOErrorType.PathNotFound.ToError(),
            IOException ioe when ioe.HResult == 13          => IOErrorType.AccessDenied.ToError(),
            IOException ioe when ioe.HResult == -2147024891 => IOErrorType.AccessDenied.ToError(),
            UnauthorizedAccessException                     => IOErrorType.AccessDenied.ToError(),
             _                                              => IOErrorType.Exn.ToError()
        };
}