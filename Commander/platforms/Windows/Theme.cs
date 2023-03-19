#if Windows

using ClrWinApi;
using Microsoft.Win32;
using System.Runtime.Versioning;
[SupportedOSPlatform("windows")]

static class Theme
{
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
}
#endif
