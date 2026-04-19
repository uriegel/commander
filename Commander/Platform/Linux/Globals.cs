#if Linux
using System.Diagnostics;
using CsTools.Extensions;

static partial class Globals
{
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
}

#endif 