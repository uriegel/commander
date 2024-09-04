module Requests
open System.IO
open Giraffe
open GtkDotNet
open FSharpTools
open Types
open Start

let sendIcon (fileRequest: FileRequest) = 
    let append ext a = a + ext
    let directory = sprintf "/usr/share/icons/%s/16x16/mimetypes" "Adwaita"
    match
        Gtk.GuessContentType fileRequest.Path
        |> Option.checkNull
        |> Option.map (fun p -> p.Replace('/', '-'))
        |> Option.defaultValue ""
        |> append ".png"
        |> Directory.combine2Pathes directory
        with
        | iconFile when File.Exists iconFile 
            -> streamFile false iconFile None None
        | iconFile when iconFile.EndsWith "image-jpeg.png" || iconFile.EndsWith "image-png.png" 
            -> streamFile false (Directory.combine2Pathes directory "image-x-generic.png") None (Some (getStartTime ()))
        | iconFile when iconFile.EndsWith "video-mp4.png" || iconFile.EndsWith "video-x-matroska.png" 
            -> streamFile false (Directory.combine2Pathes directory "video-x-generic.png") None (Some (getStartTime ()))
        | _ -> streamFile false (Directory.combine2Pathes directory "application-x-generic.png") None (Some (getStartTime ()))

