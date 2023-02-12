module Directory

open Microsoft.AspNetCore.Http
open Giraffe
open FSharpTools
open System
open System.IO
open System.Text.Json

open Configuration
open IO

type DirectoryItem = {
    Name:        string
    Size:        int64
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        DateTime
}

let getDirItem (dirInfo: DirectoryInfo) = {
    Name =        dirInfo.Name
    Size =        0
    IsDirectory = true
    IconPath    = None
    IsHidden    = dirInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
    Time        = dirInfo.LastWriteTime
}

type GetFiles = {
    Path:            string
//    CurrentItem:     InputItem option
    ShowHiddenItems: bool
}

let getIconPath (fileInfo: FileInfo) = 
    match fileInfo.Extension with
#if Windows 
    | ext when ext |> String.toLower = ".exe" -> fileInfo.FullName
#endif    
#if Linux 
    | ext when ext |> String.length > 0       -> ext
#endif    
    | _                                       -> ".noextension"

let getFileItem (fileInfo: FileInfo) = {
    Name =        fileInfo.Name
    Size =        fileInfo.Length
    IsDirectory = false
    IconPath    = Some <| getIconPath fileInfo
    IsHidden    = fileInfo.Attributes &&& FileAttributes.Hidden = FileAttributes.Hidden
    Time        = fileInfo.LastWriteTime
}

let serialize obj = TextJson.serialize (getJsonOptions ()) obj

let getItems (param: GetFiles) = async {
    
    let sortByName (item: DirectoryItem) = item.Name |> String.toLower 

    let dirInfo = DirectoryInfo param.Path
    let dirs = 
        dirInfo 
        |> getSafeDirectoriesFromInfo
        |> Seq.map getDirItem 
        |> Seq.sortBy sortByName
    let files = 
        dirInfo
        |> getSafeFilesFromInfo
        |> Seq.map getFileItem 

    let items = Seq.concat [
        dirs
        files
    ]

    let filterHidden item = not item.IsHidden

    //let getItemI i (n: DirectoryItem) = { n with Index = i }

    // let items: DirectoryItem seq = 
    //     match param.ShowHiddenItems with
    //     | true -> items 
    //     | _    -> items |> Seq.filter filterHidden
    //     |> Seq.mapi getItemI

    // let selectFolder = 
    //     match param.Path with
    //     | Some latestPath when path |> String.endsWith ".." ->
    //         let di = DirectoryInfo latestPath
    //         Some di.Name
    //     | _                                                 -> 
    //         None

    let result = {|
        Items =        items
        Path =         dirInfo.FullName
    |}

    return result |> serialize
}

let getFiles () =
    fun (next : HttpFunc) (ctx : HttpContext) ->
        task {
            let! body = ctx.ReadBodyFromRequestAsync ()
            let param = JsonSerializer.Deserialize<GetFiles>(body, getJsonOptions ())
            let! result = getItems param
            return! Json.text result next ctx
        }

