#if Windows
using CsTools.Extensions;

static partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.EndsWith(".exe", StringComparison.OrdinalIgnoreCase) && path != null
            ? path.AppendPath(name)
            : name.GetFileExtension();
}   

#endif