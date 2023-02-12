module ExtendedRename

// open FileSystem
// open FSharpTools.Directory
// open FSharpTools
// open FSharpTools.Option
// open Model

// type RenameItem = {
//     Name:    string
//     NewName: string
// }

// type RenameItemsParam = {
//     Items: RenameItem[]
//     Path:  string
// }

// let renameItems (param: RenameItemsParam) = 
    
//     let combinePath = combine2Pathes param.Path

//     let preRenameItem item = 
//         move (combinePath item.Name, combinePath ("__RENAMEING__" + item.NewName))
//         |> Result.throw
     
//     let renameItem item = 
//         move (combinePath ("__RENAMEING__" + item.NewName), combinePath item.NewName)
//         |> Result.throw

//     let renameAll () = 
//         param.Items
//         |> Array.iter preRenameItem
//         param.Items
//         |> Array.iter renameItem
    
//     Result.exceptionToResult renameAll
//     |> Result.mapError mapIOError
//     |> mapOnlyError
//     |> getError
//     |> serialize
