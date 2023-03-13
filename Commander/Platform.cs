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
#if Windows 

    public static PlatformType Value { get; } = PlatformType.Windows;
    // TODO windows dark
    public static string QueryString { get; } = "?platform=windows&theme=windows";

#elif Linux

    public static PlatformType Value { get => getPlatform(); }

    // TODO
    public static string QueryString { get; } = "?platform=linux&theme=adwaita";

    static Func<PlatformType> getPlatform = Memoize(GetPlatform);

    static PlatformType GetPlatform()
        =>  "DESKTOP_SESSION"
                .GetEnvironmentVariable()
                .GetOrDefault("") switch
            {
                "plasmawayland" => PlatformType.Kde,
                "plasma"        => PlatformType.Kde,
                _ => PlatformType.Gnome
            };

#endif
}