#if Linux
using System.Diagnostics;
using GtkDotNet;
using LinqTools;
using CsTools.Extensions;

static class Theme
{
    public static readonly string BaseTheme;
    
    public static string GetThemeName(this string osTheme)
        => osTheme.Contains("-dark")
            ? "adwaitaDark"
            : "adwaita";

    public static string Get()
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
            => Application.Dispatch(() => GObjectRef
                .WithRef(GtkSettings.GetDefault())
                .Use(Settings =>
                    Settings
                        .Value
                        .GetString("gtk-theme-name")))
                .Result;

        return Platform.Value switch
            {
                PlatformType.Kde => GetKdeTheme(),
                _ => GetGnomeTheme()
            };
        }

    public static void StartThemeDetection(Action<string> onChanged)
    {
        void StartKdeThemeDetection() { }

        async void StartGnomeThemeDetection()
        {
            try
            {
                await Application.Dispatch(() => 
                    GtkSettings.GetDefault()
                       .SignalConnect("notify::gtk-theme-name", () => 
                        onChanged(GtkSettings.GetDefault()
                                    .GetString("gtk-theme-name".GetThemeName()))
                    ));
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e);
            }
        }

        if (Platform.Value == PlatformType.Kde)
            StartKdeThemeDetection();
        else
            StartGnomeThemeDetection();
    }

    static Theme()
    => BaseTheme = Get().SubstringUntil('-');
}
#endif