using CsTools.Extensions;
using LinqTools;

using static CsTools.Functional.Memoization;

enum PlatformType
{
    Kde,
    Gnome,
    Windows
}

static partial class Platform
{
    public static string QueryString { get; }
    public static PlatformType Value { get => getPlatform(); }

    static Platform()
    {
        getPlatform = Memoize(GetPlatform);
        QueryString = $"?platform={(Value == PlatformType.Windows ? "windows" : "linux")}&theme={Theme.Get()}";
    }

    static Func<PlatformType> getPlatform;
}