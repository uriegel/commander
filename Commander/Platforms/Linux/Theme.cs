#if Linux
using System.Diagnostics;
using CsTools.Extensions;

static class Theme
{
    public static readonly string BaseTheme;
    
    static string Get()
    {
        static string GetKdeTheme()
        {
            var output = "";
            try
            {
                using var proc = new Process()
                {
                    StartInfo = new ProcessStartInfo()
                    {
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        FileName = "kreadconfig5",
                        CreateNoWindow = true,
                        Arguments = "--group \"Icons\" --key \"Theme\"",
                    },
                    EnableRaisingEvents = true
                };
                proc.OutputDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                        output = e.Data;
                };
                proc.ErrorDataReceived += (s, e) => Console.Error.WriteLine(e.Data);
                proc.Start();
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();
                proc.EnableRaisingEvents = true;
                proc.WaitForExit();
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e);
            }

            return output;
        }

        static string GetGnomeTheme()
        {
            var output = "";
            using var proc = new Process()
            {
                StartInfo = new ProcessStartInfo()
                {
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    FileName = "gsettings",
                    CreateNoWindow = true,
                    Arguments = "get org.gnome.desktop.interface gtk-theme",
                },
                EnableRaisingEvents = true
            };
            proc.OutputDataReceived += (s, e) =>
            {
                if (e.Data != null)
                    output = e.Data;
            };
            proc.ErrorDataReceived += (s, e) => Console.Error.WriteLine(e.Data);
            proc.Start();
            proc.BeginOutputReadLine();
            proc.BeginErrorReadLine();
            proc.EnableRaisingEvents = true;
            proc.WaitForExit();
            return output;
        }

        return Platform.Value switch
        {
            PlatformType.Kde => GetKdeTheme(),
            _ => GetGnomeTheme()
        };
    }

    static Theme()
        => BaseTheme = Get()[1..^1].SubstringUntil('-');
}
#endif