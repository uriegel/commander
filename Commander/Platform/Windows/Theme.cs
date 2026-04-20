#if Windows
using ClrWinApi;
using Microsoft.Win32;
using System.Runtime.Versioning;
[SupportedOSPlatform("windows")]

static class Theme
{
    public static string GetAccentColor() => GetDark() ? "red" /*"#0073e5"*/ : "#0070de";

    public static string GetThemeName(this string osTheme)
        => osTheme;

    public static void StartChangeDetecting()
    {
        if (started)
            return;
        started = true;

        var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");

        var currentTheme = GetDark();

        new Thread(_ =>
        {
            while (key != null)
            {
                var status = Api.RegNotifyChangeKeyValue(key.Handle.DangerousGetHandle(), false, 4, IntPtr.Zero, false);
                if (status != 0)
                    break;

                var theme = GetDark();
                if (currentTheme != theme)
                {
                    currentTheme = theme;
           			var color = GetAccentColor();
        			Requests.SendJson(new(null, EventCmd.ThemeChanged, new EventData { AccentColor = color }));
                }
            }
        })
        {
            IsBackground = true
        }.Start();
    }
    
    static bool GetDark()
    {
        var key = Registry.CurrentUser.OpenSubKey(@"Software\Microsoft\Windows\CurrentVersion\Themes\Personalize");

        return GetDarkThemeFromKey(key) ; 

        bool GetDarkThemeFromKey(RegistryKey? key) 
        {
            var value = key?.GetValue("SystemUsesLightTheme");
            return value == null || (int)value == 1 
            ? false
            : true;
        } 
    }


    static bool started;
}

#endif


