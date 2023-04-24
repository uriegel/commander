#if Linux
using System.Diagnostics;
using GtkDotNet;
using LinqTools;

static class Theme
{
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

            return output.Contains("-dark")
                ? "breezeDark"
                : "breeze";
        }

        static string GetGnomeTheme()
            => Application.Dispatch(() => GObjectRef
                .WithRef(GtkSettings.GetDefault())
                .Use(Settings =>
                    Settings
                        .Value
                        .GetString("gtk-theme-name")))
                .Result
                    .Contains("-dark")
                            ? "adwaitaDark"
                            : "adwaita";
                    
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
                                    .GetString("gtk-theme-name")
                                    .Contains("-dark")
                                    ? "adwaitaDark"
                                    : "adwaita")
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
}
#endif