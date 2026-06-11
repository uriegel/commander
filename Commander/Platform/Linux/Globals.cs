#if Linux
using System.Diagnostics;
using CsTools;
using CsTools.Extensions;
using Gtk4DotNet.Exceptions;

static partial class Globals
{
    public static SystemError? CheckPlatformException(Exception e)
    {
        if (e is GFileException gfe)
            return new SystemError(ErrorType.Unknown, gfe.Message);
        else return null;
    }

    public static string Platform { get; } = "linux";
}

#endif 