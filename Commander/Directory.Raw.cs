using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;

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
            DirectoryNotFoundException  => IOErrorType.PathNotFound.ToError(),
            IOException                 => IOErrorType.AccessDenied.ToError(),
             _                          => IOErrorType.Exn.ToError()
        };
}