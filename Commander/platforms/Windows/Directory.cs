#if Windows

static partial class Directory
{
    public static string GetIconPath(FileInfo info)
        => string.Compare(info.Extension, ".exe", true) == 0 
        ? info.FullName
        : info.Extension?.Length > 0 ? info.Extension 
        : ".noextension";

    public static Task ProcessIcon(HttpContext context, string iconHint)
        => RepeatOnException(() => 
            WebWindowNetCore.WebView.GtkApplication!.Dispatch(async () =>
                {
                    using var iconInfo = IconInfo.Choose(iconHint, 16, IconLookup.ForceSvg);
                    var iconFile = iconInfo.GetFileName();
                    using var stream = iconFile?.OpenFile();
                    await context.SendStream(stream!, null);
                }, 100), 
            1);
open ClrWinApi
    // let rec getIconHandle callCount = async {
    //     if ext |> String.contains "\\" then
    //         return Icon.ExtractAssociatedIcon(ext).Handle
    //     else
    //         let mutable shinfo = ShFileInfo()
    //         SHGetFileInfo(ext, FileAttributeNormal, &shinfo, Marshal.SizeOf shinfo,
    //             SHGetFileInfoConstants.ICON
    //             ||| SHGetFileInfoConstants.SMALLICON
    //             ||| SHGetFileInfoConstants.USEFILEATTRIBUTES
    //             ||| SHGetFileInfoConstants.TYPENAME) |> ignore

    //         if shinfo.IconHandle <> IntPtr.Zero then
    //             return shinfo.IconHandle
    //         elif callCount < 3 then
    //             do! Async.Sleep 29
    //             return! getIconHandle <| callCount + 1
    //         else
    //             return Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll").Handle
    // }

    // let! iconHandle = getIconHandle 0
    // use icon = Icon.FromHandle iconHandle
    // use bitmap = icon.ToBitmap()
    // let ms = new MemoryStream()
    // bitmap.Save(ms, ImageFormat.Png)
    // ms.Position <- 0L
    // DestroyIcon iconHandle |> ignore
    // return ms


}

#endif