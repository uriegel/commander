#if Linux
using System.Diagnostics;
using CsTools.Extensions;
using GtkDotNet.Exceptions;

static partial class Globals
{
    public static SystemError? CheckPlatformException(Exception e)
    {
        if (e is GFileException gfe)
            return new SystemError(ErrorType.Unknown, gfe.Message);
        else return null;
    }
    public static string IconProcessor { get; private set; } = "";
    public static void InitializeResourceFiles()
    {
        var homeDir = Environment.GetEnvironmentVariable("HOME");
        var path = homeDir.AppendPath(".config").AppendPath(APP_ID);
        var icon = Resources.Get("icon");
        IconProcessor = path.AppendPath("icon");
        using var writer = File.OpenWrite(IconProcessor);
        icon?.CopyTo(writer);
        writer.Dispose();
        var psi = new ProcessStartInfo("chmod")
        {
            ArgumentList = { "+x", IconProcessor },
            CreateNoWindow = true,
        };
        using var p = new Process { StartInfo = psi };
        p.Start();
        p.WaitForExit();
    }

    public static string Platform { get; } = "linux";
}

#endif 