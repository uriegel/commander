#if Windows

using Microsoft.AspNetCore.Http;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;

using AspNetExtensions;
using ClrWinApi;
using LinqTools;

using static ClrWinApi.Api;
using static CsTools.Core;
using System.Diagnostics;
using CsTools.Extensions;

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => string.Compare(info.Extension, ".exe", true) == 0 
        ? info.FullName
        : info.Extension?.Length > 0 ? info.Extension 
        : ".noextension";

    public static async Task ProcessIcon(HttpContext context, string iconHint)
    {
        var stream = await GetIconStream(iconHint);
        await context.SendStream(stream!, startTime, "icon.png");
    }

    static async Task<Stream> GetIconStream(string iconHint)
    {
        var handle = await Try(async () => iconHint.Contains('\\')
            ? Icon.ExtractAssociatedIcon(iconHint)?.Handle
            : await RepeatOnException(() => 
                {
                    var shinfo = new ShFileInfo();
                    var handle = SHGetFileInfo(iconHint, FileAttributeNormal, ref shinfo, Marshal.SizeOf(shinfo),
                        SHGetFileInfoConstants.ICON | SHGetFileInfoConstants.SMALLICON | SHGetFileInfoConstants.USEFILEATTRIBUTES | SHGetFileInfoConstants.TYPENAME); 
                    return shinfo.IconHandle != IntPtr.Zero
                        ? shinfo.IconHandle.ToAsync()
                        : throw new Exception("Not found");
                }, 3, TimeSpan.FromMilliseconds(40)),
                _ => Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll")!.Handle);

        using var icon = Icon.FromHandle(handle.Value);
        using var bitmap = icon.ToBitmap();
        var ms = new MemoryStream();
        bitmap.Save(ms, ImageFormat.Png);
        ms.Position = 0;
        DestroyIcon(handle.Value);
        return ms;
    }

    public static Task<GetExtendedItemsResult> GetExtendedItems(GetExtendedItems getExtendedItems)
    {
        Version? GetVersion(string file)
            => FileVersionInfo
                .GetVersionInfo(getExtendedItems
                                    .Path
                                    .AppendPath(file))
                .MapVersion();

        Version? CheckGetVersion(string item)
            => item.EndsWith(".exe", StringComparison.InvariantCultureIgnoreCase) || item.EndsWith(".dll", StringComparison.InvariantCultureIgnoreCase)
                ? GetVersion(item)
                : null;

        return (GetExtendedItems(getExtendedItems.Path, getExtendedItems.Items) with 
        {
            Versions = getExtendedItems
                        .Items
                        .Select(CheckGetVersion)
                        .ToArray()
        })
            .ToAsync();
    }

    // TODO
    const int FileAttributeNormal = 0x80;

    static readonly DateTime startTime = DateTime.Now;
}

record Version(
    int Major,
    int Minor,
    int Patch,
    int Build
);

record GetExtendedItemsResult(
    DateTime?[] ExifTimes,
    Version?[]? Versions,
    string Path
) {
    public static GetExtendedItemsResult New(DateTime?[] exifTimes, string path)
        => new(exifTimes, null, path);
};

static class VersionExtensions
{
    public static Version? MapVersion(this FileVersionInfo? info)
        => info != null
            ? new(info.FileMajorPart, info.FileMinorPart, info.FilePrivatePart, info.FileBuildPart)
            : null;
}    

#endif