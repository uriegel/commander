module PlatformDirectory

open ClrWinApi
open System
open System.Drawing
open System.Drawing.Imaging
open System.IO
open System.Runtime.InteropServices

let getIcon ext = async {
    let rec getIconHandle callCount = async {
        let mutable shinfo = ShFileInfo()
        SHGetFileInfo(ext, FileAttributeNormal, &shinfo, Marshal.SizeOf shinfo,
            SHGetFileInfoConstants.ICON
            ||| SHGetFileInfoConstants.SMALLICON
            ||| SHGetFileInfoConstants.USEFILEATTRIBUTES
            ||| SHGetFileInfoConstants.TYPENAME) |> ignore

        if shinfo.IconHandle <> IntPtr.Zero then
            return shinfo.IconHandle
        elif callCount < 3 then
            do! Async.Sleep 29
            return! getIconHandle <| callCount + 1
        else
            return Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll").Handle
    }

    let! iconHandle = getIconHandle 0
    use icon = Icon.FromHandle iconHandle
    use bitmap = icon.ToBitmap()
    let ms = new MemoryStream()
    bitmap.Save(ms, ImageFormat.Png)
    ms.Position <- 0L
    DestroyIcon iconHandle |> ignore
    return ms
}