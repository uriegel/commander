using CsTools.Extensions;
using CsTools.Functional;

using static CsTools.Core;

static partial class Directory
{
    public static Result<Nothing, Error> Move(string path, string newPath)
        // TODO when renamed select new file
        => Try(
            () => nothing.SideEffect(_ => System.IO.Directory.Move(path, newPath)),
            MapException);

    static Error MapException(Exception e)
        => e switch
        {
            // TODO Windows
            DirectoryNotFoundException  => Error.IOError(IOErrorType.PathNotFound),
            // TODO Windows run uac 
            IOException                 => Error.IOError(IOErrorType.AccessDenied),
             _                          => Error.IOError(IOErrorType.Exn)
        };
}