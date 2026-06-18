#if Linux

using Gtk4DotNet;

static partial class Globals
{
    public static SystemError? CheckPlatformException(Exception e)
    {
        if (e is GtkException gfe)
            return new SystemError(ErrorType.Unknown, gfe.Message);
        else return null;
    }

    public static string Platform { get; } = "linux";
}

#endif 