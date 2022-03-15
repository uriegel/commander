module PlatformDirectory

open ClrWinApi
open FSharpTools
open System
open System.Diagnostics
open System.Drawing
open System.Drawing.Imaging
open System.IO
open System.Runtime.InteropServices

open Model

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.toLower = ".exe" -> fileInfo.FullName
    | ext when ext |> String.length > 0       -> ext
    | _                                       -> ".noextension"

let getIcon ext = async {
    let rec getIconHandle callCount = async {
        if ext |> String.contains "\\" then
            return Icon.ExtractAssociatedIcon(ext).Handle
        else
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

let appendPlatformInfo requestId id (path: string) (items: DirectoryItem seq) = 

    let filterEnhanced item = 
        (  item.Name |> String.endsWithComparison "exe" System.StringComparison.OrdinalIgnoreCase
        || item.Name |> String.endsWithComparison "dll" System.StringComparison.OrdinalIgnoreCase)
        && requestId.Id = id

    let addVersion (item: DirectoryItem) = 
        if requestId.Id = id then
            Option.ofObj (FileVersionInfo.GetVersionInfo <| Path.Combine(path, item.Name))
        else 
            None

    let versionItems = 
        items
        |> Seq.filter filterEnhanced
        |> Seq.map addVersion
        |> Seq.toArray

    
    printfn "versions: %O" (versionItems |> Seq.toArray)
    ()