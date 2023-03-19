#if Windows

using ClrWinApi;
using AspNetExtensions;

using Microsoft.AspNetCore.Http;
using System.Drawing;

using System.Runtime.InteropServices;
using LinqTools;

using static CsTools.Core;
using static ClrWinApi.Api;
// TODO wrong no namespace in CsTools
using static Core;
using System.Drawing.Imaging;

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
        await context.SendStream(stream!, null);
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

    // TODO
    const int FileAttributeNormal = 0x80;
}

#endif