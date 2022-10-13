module Engines

open FSharpTools
open System.Text.Json

open Configuration
open Directory
open Engine
open Model

type CreateFolderParam = {
    Engine: EngineType
    Path:   string
    Name:   string
}

type DeleteItemsParam = {
    Engine: EngineType
    Path:   string
    Items:  string array
}

type RenameItemParam = {
    Engine:  EngineType
    Path:    string
    Name:    string
    NewName: string
}

type PrepareCopyItemsParam = {
    FolderId:         string
    SourceEngineType: EngineType
    SourcePath:       string
    Items:            string[]
    TargetEngineType: EngineType
    TargetPath:       string
    Move:             bool option
}

type CopyItemsParam = {
    FolderId:          string
    SourcePath:        string
    SourceEngineType:  EngineType
    TargetEngineType:  EngineType
    Move:              bool option
    ConflictsExcluded: bool
}

type PostCopyItemsParam = {
    SourceEngineType: EngineType
    TargetEngineType: EngineType
}

let getEngineAndPathFrom engine path item body =
    match engine with
    | EngineType.Root    -> Root.getEngineAndPathFrom item body
    | EngineType.Remotes -> Remotes.getEngineAndPathFrom item body
    | EngineType.Android -> Android.getEngineAndPathFrom item body
    | _                  -> Directory.getEngineAndPathFrom path item.Name

let getEngineAndPathFromPath path =
    match path with
    | RootID                                        -> EngineType.Root,      RootID
    | RemotesID                                     -> EngineType.Remotes,   RemotesID
    | path when path |> String.startsWith AndroidID -> EngineType.Android,   path
    | _                                             -> EngineType.Directory, path

let getEngineAndPath (getItems: GetItems) body =
    match getItems.Path, getItems.CurrentItem with
    | Some path, Some item -> getEngineAndPathFrom getItems.Engine path item body
    | Some path, _         -> getEngineAndPathFromPath path 
    | _                    -> EngineType.Root, "path"

let getItems (param: GetItems) body = 
    match getEngineAndPath param body with
    | EngineType.Root, _       -> Root.getItems param.Engine param.Path
    | EngineType.Remotes, _    -> Remotes.getItems param.Engine param.FolderId param.Path 
    | EngineType.Android, path -> Android.getItems param.Engine path param.Path
    | _, path                  -> Directory.getItems path param

let getFilePath (param: GetFile) body = 
    let getEmptyPath = async { 
        return  JsonSerializer.Serialize({ Path = "" }, getJsonOptions ()) 
    }

    match param.Engine with
    | EngineType.Root      -> Root.getFile body
    | EngineType.Directory -> Directory.getFile body
    | _                    -> getEmptyPath 

let getActionsTexts (param: GetActionsTexts) = 

    let getFilesOrDirs () = 
        match param.Dirs, param.Files with
        | dirs, 0 when dirs = 1   -> "das Verzeichnis" 
        | dirs, 0                 -> "die Verzeichnisse" 
        | 0, files when files = 1 -> "die Datei" 
        | 0, files                -> "die Dateien" 
        | _                             -> "die Einträge" 

    let getRemotes () = 
        match param.Dirs with
        | 1 -> "den entfernten Rechner" 
        | _ -> "die entfernte Rechner" 

    match param.EngineType, param.OtherEngineType, param.Type, param.Conflicts with
    | EngineType.Directory, _, ActionType.CreateFolder, _                          -> Some "Neuen Ordner anlegen"
    | EngineType.Directory, _, ActionType.Delete, _                                -> Some (sprintf "Möchtest Du %s löschen?"    <| getFilesOrDirs ())
    | EngineType.Directory, Some(EngineType.Directory), ActionType.Copy, Some true -> Some (sprintf "Einträge überschreiben beim Kopieren?")
    | EngineType.Directory, Some(EngineType.Directory), ActionType.Copy, _         -> Some (sprintf "Möchtest Du %s kopieren?"   <| getFilesOrDirs ())
    | EngineType.Directory, Some(EngineType.Directory), ActionType.Move, Some true -> Some (sprintf "Einträge überschreiben beim Verschieben?")
    | EngineType.Directory, Some(EngineType.Directory), ActionType.Move, _         -> Some (sprintf "Möchtest Du %s verschieben?"<| getFilesOrDirs ())
    | EngineType.Directory, _, ActionType.Rename, _                                -> Some (sprintf "Möchtest Du %s umbenennen?" <| getFilesOrDirs ())
    | EngineType.Remotes, _, ActionType.Delete, _                                  -> Some (sprintf "Möchtest Du %s löschen?"    <| getRemotes ())
    | EngineType.Android, _, ActionType.Delete, _                                  -> Some (sprintf "Möchtest Du %s löschen?"    <| getFilesOrDirs ())
    | _                                                                            -> None
    

let createfolder (param: CreateFolderParam) =
    match param.Engine with
    | EngineType.Directory -> [| param.Path; param.Name|] |> createFolder
    | _                    -> ""

let renameItem (param: RenameItemParam) =
    match param.Engine with
    | EngineType.Directory -> renameItem {Path = param.Path; Name = param.Name; NewName = param.NewName}
    | _                    -> ""

let deleteItems (param: DeleteItemsParam) =
    let getItems () = 
        param.Items
        |> Array.map (combine2Pathes param.Path)
    
    match param.Engine with
    | EngineType.Directory -> deleteItems <| getItems ()
    | _                    -> ""

let prepareFileCopy (files: string[]) =
    prepareFileCopy files

let prepareCopy (param: PrepareCopyItemsParam) =
    match param.SourceEngineType, param.TargetEngineType with
    | EngineType.Directory, EngineType.Directory -> prepareCopy param.Items param.SourcePath param.TargetPath
    | _ -> ""

let copyItems (param: CopyItemsParam) =
    match param.SourceEngineType, param.TargetEngineType with
    | EngineType.Directory, EngineType.Directory -> copyItems param.FolderId param.SourcePath param.Move param.ConflictsExcluded ()
    | _ -> ""

let postCopyItems (param: PostCopyItemsParam) = 
    match param.SourceEngineType, param.TargetEngineType with
    | EngineType.Directory, EngineType.Directory -> postCopyItems ()
    | _ -> ""
