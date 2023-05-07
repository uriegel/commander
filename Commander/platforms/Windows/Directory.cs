#if Windows

using Microsoft.AspNetCore.Http;
using System.Drawing;
using System.Drawing.Imaging;
using System.Runtime.InteropServices;
using System.Diagnostics;

using AspNetExtensions;
using ClrWinApi;
using LinqTools;
using CsTools.Extensions;

using static ClrWinApi.Api;
using static CsTools.Core;

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

    public static Task<IOResult> DeleteItems(DeleteItemsParam input)
        => (SHFileOperation(new ShFileOPStruct
        {
            Func = FileFuncFlags.DELETE,
            From = string.Join( "\U00000000", input.Names.Select(n => input.Path.AppendPath(n))) 
                        +  "\U00000000\U00000000",
            Flags = FileOpFlags.NOCONFIRMATION
                | FileOpFlags.NOERRORUI
                | FileOpFlags.NOCONFIRMMKDIR
                | FileOpFlags.SILENT
                | FileOpFlags.ALLOWUNDO
        }) switch
        {
            0    => (IOError?)null,
            2    => IOError.FileNotFound,
            0x78 => IOError.AccessDenied,
            _    => IOError.Exn
        })
            .ToTask();

    static void CopyItem(string name, string path, string targetPath, Action<long, long> progress, bool move, CancellationToken cancellationToken)
        => Copy(path.AppendPath(name), targetPath.AppendPath(name), progress, move, cancellationToken);

    static void Copy(string source, string target, Action<long, long> progress, bool move, CancellationToken cancellationToken)
    {
        var cancel = 0;
        cancellationToken.Register(() => cancel = -1);
        if (move)
            Api.MoveFileWithProgress(source, target, (total, current, c, d, e, f, g, h, i) => {
                progress(current, total);
                return CopyProgressResult.Continue;
            }, IntPtr.Zero, MoveFileFlags.CopyAllowed);
        else
            Api.CopyFileEx(source, target, (total, current, c, d, e, f, g, h, i) => {
                progress(current, total);
                return CopyProgressResult.Continue;
            }, IntPtr.Zero, ref cancel, (CopyFileFlags)0);
    }
  
    static IOError MapExceptionToIOError(Exception e)
        => e switch
        {
            UnauthorizedAccessException ue => IOError.AccessDenied,
            _                              => IOError.Exn
        };

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
    public GetExtendedItemsResult(DateTime?[] exifTimes, string path)
        : this(exifTimes, null, path) {}
};

static class VersionExtensions
{
    public static Version? MapVersion(this FileVersionInfo? info)
        => info != null
            ? new(info.FileMajorPart, info.FileMinorPart, info.FilePrivatePart, info.FileBuildPart)
            : null;
}    

#endif