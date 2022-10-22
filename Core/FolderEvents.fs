module FolderEvents

open System.Reactive.Subjects

open Model

let leftFolderReplaySubject = new Subject<FolderEvent>()
let rightFolderReplaySubject = new Subject<FolderEvent>()

let getEventSubject folderId = 
    if folderId = "folderLeft" then 
        leftFolderReplaySubject
    else
        rightFolderReplaySubject
