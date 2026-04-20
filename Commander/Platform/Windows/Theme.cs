#if Windows
using ClrWinApi;
using Microsoft.Win32;
using System.Runtime.Versioning;
[SupportedOSPlatform("windows")]

static class Theme
{
    static bool darkMode = false;
    public static string GetAccentColor() => darkMode ? "#0073e5" : "#0070de";

    public static string GetThemeName(this string osTheme)
        => osTheme;

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

    public static void StartChangeDetecting()
    {
        if (started)
            return;
        started = true;
        
        var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");

        var currentTheme = Get();    

        new Thread(_ =>
        {
            while (key != null)
            {
                var status = Api.RegNotifyChangeKeyValue(key.Handle.DangerousGetHandle(), false, 4, IntPtr.Zero, false);
                if (status != 0)
                    break;

                var theme = Get();
                if (currentTheme != theme) {
                    currentTheme = theme;
                    onChanged(theme);
                }
            }
        }){
            IsBackground = true
        }.Start();
    }

    static bool started;
}

#endif


