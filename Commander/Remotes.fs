module Remotes
open FolderEvents
open Model

let renameItem id name newName = 
    let subj = getEventSubject id
    subj.OnNext <| RenameRemote {
        Name = name
        NewName = newName
    }
    "{}"