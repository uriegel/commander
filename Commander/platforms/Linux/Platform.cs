#if Linux
using CsTools.Extensions;
using LinqTools;

static partial class Platform
{
    static PlatformType GetPlatform()
        =>  "DESKTOP_SESSION".GetEnvironmentVariable() switch
            {
                "plasmawayland" => PlatformType.Kde,
                "plasma"        => PlatformType.Kde,
                _ => PlatformType.Gnome
            };
}

#endif