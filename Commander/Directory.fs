module Directory
open Engine

// open Engine
// open PlatformModel

// type Directory () = 
//     interface IEngine with
//         member val Id = EngineType.Root with get
//         member _.getItems (param: GetItems) = async {
//             return {
//                 Items = [||]
//                 Path = ""
//                 Engine = EngineType.Directory
//                 Columns = None
//             }
//         }

//         member _.getEngineType (path: string) (item: RootItem) =
//             EngineType.Directory

let getEngineAndPathFrom path item = EngineType.Directory