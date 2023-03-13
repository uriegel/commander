using CsTools.Extensions;
using LinqTools;

using static CsTools.Functional.Memoization;

enum PlatformType
{
    Kde,
    Gnome,
    Windows
}

static class Platform
{
    public static string QueryString { get; }

#if Windows 

    public static PlatformType Value { get; } 

#elif Linux

    public static PlatformType Value { get => getPlatform(); }

    static PlatformType GetPlatform()
        =>  "DESKTOP_SESSION"
                .GetEnvironmentVariable()
                .GetOrDefault("") switch
            {
                "plasmawayland" => PlatformType.Kde,
                "plasma"        => PlatformType.Kde,
                _ => PlatformType.Gnome
            };

    static Func<PlatformType> getPlatform;

#endif

    static Platform()
    {
#if Windows        
        Value = PlatformType.Windows;
#elif Linux        
        getPlatform = Memoize(GetPlatform);
#endif
        QueryString = $"?platform={(Value == PlatformType.Windows ? "windows" : "linux")}&theme={Theme.Get()}";
    }
        

}