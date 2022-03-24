module Engines

open FSharpTools
open System.Text.Json

open Configuration
open Engine
open Model

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
    | EngineType.Android, path -> Android.getItems param.Engine path 
    | _, path                  -> Directory.getItems path param

let getFilePath (param: GetFile) body = 
    let getEmptyPath = async { 
        return  JsonSerializer.Serialize({ Path = "" }, getJsonOptions ()) 
    }

    match param.Engine with
    | EngineType.Root      -> Root.getFile body
    | EngineType.Directory -> Directory.getFile body
    | _                    -> getEmptyPath 



