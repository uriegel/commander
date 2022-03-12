module Engines

open Engine

let getEngineAndPathFrom engine path item body =
    match engine with
    | EngineType.Root -> Root.getEngineAndPathFrom item body
    | _               -> Directory.getEngineAndPathFrom path item.Name

let getEngineAndPathFromPath engine path =
    EngineType.Root

// let getEngineFrom path item (engine: IEngine) : IEngine = 
//     match engine.getEngineType path item with
//     | id when id = engine.Id -> engine
//     | EngineType.Root        -> Root ()   
//     | _                      -> Directory ()   

let getEngineAndPath (getItems: GetItems) body =
    // TODO Active patterns with json deserializing param in engine
    match getItems.Path, getItems.CurrentItem with
    | Some path, Some item -> getEngineAndPathFrom getItems.Engine path item body
 //   | Some path, _         -> getEngineAndPathFromPath getItems.Engine path 
    | _                    -> EngineType.Root, "path"

let getItems (param: GetItems) (body: string) = 
    match getEngineAndPath param body with
    | EngineType.Root, _ -> Root.getItems param.Engine
    | _, path            -> Directory.getItems param.Engine path
