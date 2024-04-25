using static CsTools.Functional.Memoization;

enum PlatformType
{
    Kde,
    Gnome,
    Windows
}

static partial class Platform
{
    public static PlatformType Value { get => getPlatform(); }

    static Platform()
    {
        getPlatform = Memoize(GetPlatform);
    }

    static Func<PlatformType> getPlatform;
}