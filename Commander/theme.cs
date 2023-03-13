#if Linux
using System.Diagnostics;
#endif


#if Windows
using Microsoft.Win32;
using System.Runtime.Versioning;
using System.Runtime.InteropServices;

[SupportedOSPlatform("windows")]
#endif

static class Theme
{
#if Linux
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
            }
            catch (Exception e)
            {
                Console.Error.WriteLine(e);
            }

            return output.Contains("-dark")
                ? "adwaitaDark"
                : "adwaita";
        }
        return Platform.Value switch
        {
            PlatformType.Kde => GetKdeTheme(),
            _                => GetGnomeTheme()
        };
    }

    public static void StartThemeDetection(Action<string> onChanged)
    {
        void StartKdeThemeDetection() { }

        async void StartGnomeThemeDetection()
        {
            try
            {
                using var proc = new Process()
                {
                    StartInfo = new ProcessStartInfo()
                    {
                        RedirectStandardOutput = true,
                        RedirectStandardError = true,
                        FileName = "gsettings",
                        CreateNoWindow = true,
                        Arguments = "monitor org.gnome.desktop.interface gtk-theme",
                    },
                    EnableRaisingEvents = true
                };
                proc.OutputDataReceived += (s, e) =>
                {
                    if (e.Data != null)
                        onChanged(e.Data.Contains("-dark") ? "adwaitaDark" : "adwaita");

                };
                proc.ErrorDataReceived += (s, e) => Console.Error.WriteLine(e.Data);
                proc.Start();
                proc.BeginOutputReadLine();
                proc.BeginErrorReadLine();
                proc.EnableRaisingEvents = true;
                await proc.WaitForExitAsync(CancellationToken.None);
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

#endif

#if Windows

    public static string Get()
    {
        var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");

        return GetThemeFromKey(key);

        string GetThemeFromKey(RegistryKey? key) 
        {
            var value = key?.GetValue("SystemUsesLightTheme");
            return value == null || (int)value == 1 
            ? "windows"
            : "windowsDark";
        } 
    }


    public static void StartThemeDetection(Action<string> onChanged)
    {
        var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");

        var currentTheme = Get();    

        new Thread(_ =>
        {
            while (key != null)
            {
                var status = RegNotifyChangeKeyValue(key.Handle.DangerousGetHandle(), false, 4, IntPtr.Zero, false);
                if (status != 0)
                    break;

                var theme = Get();
                if (currentTheme != theme) {
                    currentTheme = theme;
                    onChanged(theme);
                }
            }
        }).Start();
    } 

#endif
}