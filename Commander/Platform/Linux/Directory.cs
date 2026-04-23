#if Linux

using CsTools.Extensions;

static partial class Directory
{
    public static string? GetIconPath(string name, string? path)
        => name.GetFileExtension();
}   

#endif