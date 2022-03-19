module PlatformDirectory

open System.Diagnostics
open System.IO
open System.Reactive.Subjects

open Configuration
open Engine
open Model

let extendColumns columns = columns

let private getIconScript = 
    let filename = saveResource (getElectronFile "geticon.py", "python/geticon.py")
    let getIconScript () = filename
    getIconScript

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
    | ext when ext |> String.length > 0 -> ext
    | _                                 -> ".noextension"

let getIcon (param: FileRequest) = 
    let mutable output = ""
    try 
        use proc = new Process() 
        proc.StartInfo <- ProcessStartInfo()
        proc.StartInfo.RedirectStandardOutput <- true
        proc.StartInfo.RedirectStandardError <- true
        proc.StartInfo.FileName <- "python3"
        proc.StartInfo.CreateNoWindow <- true
        proc.StartInfo.Arguments <- sprintf "%s %s" (getIconScript ()) param.Path
        proc.EnableRaisingEvents <- true
        proc.OutputDataReceived.Add(fun data -> if data.Data <> null then output <- data.Data)
        proc.ErrorDataReceived.Add(fun data -> eprintfn "%s" data.Data)
        proc.Start() |> ignore
        proc.BeginOutputReadLine();
        proc.BeginErrorReadLine();
        proc.EnableRaisingEvents <- true
        proc.WaitForExit ()
    with
        | _ as e -> eprintfn "%s" <| e.ToString ()
    output

let appendPlatformInfo (subj: Subject<FolderEvent>) requestId id (path: string) (items: DirectoryItem seq) = ()
