#if Linux
using System.Diagnostics;
using GtkDotNet;
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
            => Gtk.Dispatch(() => 
                GtkSettings.GetDefault()
                    .GetString("gtk-theme-name"))
                .Result ?? "";

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
            await Gtk.Dispatch(() =>
                GtkSettings
                    .GetDefault()
                    .OnNotify("gtk-theme-name", s =>
                        onChanged(s.GetString("gtk-theme-name")
                                    ?.GetThemeName() ?? "")));
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