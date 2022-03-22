module Engines

open Model
open Engine
open Utils
open System.Text.Json
open Configuration

let getEngineAndPathFrom engine path item body =
    match engine with
    | EngineType.Root -> Root.getEngineAndPathFrom item body
    | _               -> Directory.getEngineAndPathFrom path item.Name

let getEngineAndPathFromPath path =
    match path with
    | RootID    -> EngineType.Root,      RootID
    | RemotesID -> EngineType.Remotes,   RemotesID
    | _         -> EngineType.Directory, path

let getEngineAndPath (getItems: GetItems) body =
    match getItems.Path, getItems.CurrentItem with
    | Some path, Some item -> getEngineAndPathFrom getItems.Engine path item body
    | Some path, _         -> getEngineAndPathFromPath path 
    | _                    -> EngineType.Root, "path"

let getItems (param: GetItems) body = 
    match getEngineAndPath param body with
    | EngineType.Root,    _ -> Root.getItems param.Engine param.Path
    | EngineType.Remotes, _ -> Remotes.getItems param.Engine param.FolderId param.Path 
    | _, path               -> Directory.getItems path param

let getFilePath (param: GetFile) body = 
    let getEmptyPath = async { 
        return  JsonSerializer.Serialize({ Path = "" }, getJsonOptions ()) 
    }

    match param.Engine with
    | EngineType.Root      -> Root.getFile body
    | EngineType.Directory -> Directory.getFile body
    | _                    -> getEmptyPath 



