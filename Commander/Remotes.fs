module Remotes
open Model

let renameItem name newName = 
    rendererReplaySubject.OnNext <| RenameRemote {
        Name = name
        NewName = newName
    }
    "{}"

let deleteItems items =
    "{}"
    
