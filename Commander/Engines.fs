module Engines

open Engine

let getEngineAndPathFrom engine path item body =
    match engine with
    | EngineType.Root -> Root.getEngineAndPathFrom item body
    | _               -> Directory.getEngineAndPathFrom path item.Name

let getEngineAndPathFromPath path =
    match path with
    | "root" -> EngineType.Root, "root"
    | _      -> EngineType.Directory, path

let getEngineAndPath (getItems: GetItems) body =
    match getItems.Path, getItems.CurrentItem with
    | Some path, Some item -> getEngineAndPathFrom getItems.Engine path item body
    | Some path, _         -> getEngineAndPathFromPath path 
    | _                    -> EngineType.Root, "path"

let getItems (param: GetItems) (body: string) = 
    match getEngineAndPath param body with
    | EngineType.Root, _ -> Root.getItems param.Engine param.Path
    | _, path            -> Directory.getItems param.Engine path param.Path
