#if Windows
using System.Runtime.InteropServices;
using System.Drawing.Imaging;

using ClrWinApi;
using CsTools.Functional;
using CsTools.Async;
using CsTools.Extensions;

using static CsTools.Core;
using static ClrWinApi.Api;

static class Icon
{
    public static async Task<byte[]> GetAsync(string name)
    {
        if (name.StartsWith("ext:"))
        {
            var ext = name["res:".Length..];
            return await GetIconStream(ext.Replace('/', '\\'));
        } 
        else
        {
            var icon = Resources.Get(name);
            if (icon != null)
            {
                using var ms = new MemoryStream();
                await (icon?.CopyToAsync(ms) ?? Task.CompletedTask);
                return ms.ToArray();
            }
            else
                return [];
        }
    }

    static Task<byte[]> GetIconStream(string iconHint)
        => Try(() => iconHint.Contains('\\')
            ? (System.Drawing.Icon.ExtractAssociatedIcon(iconHint)?.Handle ?? 0).ToAsync()
            : RepeatOnException(() => 
                {
                    var shinfo = new ShFileInfo();
                    var handle = SHGetFileInfo(iconHint, ClrWinApi.FileAttributes.Normal, ref shinfo, Marshal.SizeOf(shinfo),
                        SHGetFileInfoConstants.ICON | SHGetFileInfoConstants.SMALLICON | SHGetFileInfoConstants.USEFILEATTRIBUTES | SHGetFileInfoConstants.TYPENAME); 
                    return shinfo.IconHandle != IntPtr.Zero
                        ? shinfo.IconHandle.ToAsync()
                        : throw new Exception("Not found");
                }, 3, TimeSpan.FromMilliseconds(40)), _ => System.Drawing.Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll")!.Handle)
            ?.Select(handle => 
                {
                    using var icon = System.Drawing.Icon.FromHandle(handle);
                    using var bitmap = icon.ToBitmap();
                    var ms = new MemoryStream();
                    bitmap.Save(ms, ImageFormat.Png);
                    ms.Position = 0;
                    DestroyIcon(handle);
                    return ms.GetBuffer();
                }) 
            ?? Array
                .Empty<byte>()
                .ToAsync();

    public static void StopProcessing() { }

    public static bool IsSvg(this byte[] payload) => false;
}

#endif