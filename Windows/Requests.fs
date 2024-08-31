module Requests
open System.Drawing
open System.Drawing.Imaging
open System.IO
open System.Runtime.InteropServices
open System.Threading
open Microsoft.AspNetCore.Http
open Giraffe
open ClrWinApi
open Types

let sendIcon (fileRequest: FileRequest) = 
    let hiconHandle = 
        if fileRequest.Path.Contains '\\' then
            Icon.ExtractAssociatedIcon(fileRequest.Path).Handle
        else
            let rec getIconHandle count = 
                if count < 3 then
                    let mutable shinfo = ShFileInfo()
                    Api.SHGetFileInfo(fileRequest.Path, FileAttributes.Normal, &shinfo, Marshal.SizeOf(shinfo),
                        SHGetFileInfoConstants.ICON 
                        ||| SHGetFileInfoConstants.SMALLICON 
                        ||| SHGetFileInfoConstants.USEFILEATTRIBUTES 
                        ||| SHGetFileInfoConstants.TYPENAME) |> ignore
                    if shinfo.IconHandle <> 0 then
                        shinfo.IconHandle
                    else
                        Thread.Sleep 40
                        getIconHandle <| count + 1
                else
                    Icon.ExtractAssociatedIcon(@"C:\Windows\system32\SHELL32.dll").Handle
            getIconHandle 0
    use icon = Icon.FromHandle hiconHandle
    use bitmap = icon.ToBitmap()
    let ms = new MemoryStream()
    bitmap.Save(ms, ImageFormat.Png)
    ms.Position <- 0
    Api.DestroyIcon hiconHandle |> ignore
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            return! ctx.WriteStreamAsync(false, ms, None, None)
        }
