using AspNetExtensions;
using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

static partial class Directory
{
    public static Result<Nothing, RequestError> Move(string path, string newPath)
        // TODO functional-extensions new version:
        // TODO Nothing type
        // TODO base url for jsonPost
        // TODO when renamed select new file
        => Try(
            () => nothing.SideEffect(_ => System.IO.Directory.Move(path, newPath)),
            MapException);

    static RequestError MapException(Exception e)
        => e switch
        {
            // TODO take status statustext
            // TODO Windows
            DirectoryNotFoundException  => IOErrorType.PathNotFound.ToError(),
            // TODO Windows run uac 
            IOException                 => IOErrorType.AccessDenied.ToError(),
             _                          => IOErrorType.Exn.ToError()
        };
}