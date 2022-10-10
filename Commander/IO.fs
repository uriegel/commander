module IO

open System.IO

let private getSafeArray getArray = 
    try 
        getArray ()
    with
    | _ -> Array.empty

let InfoFromPath path = DirectoryInfo path    

let getSafeDirectoriesFromInfo (dirInfo: DirectoryInfo) = getSafeArray dirInfo.GetDirectories
let getSafeFilesFromInfo (dirInfo: DirectoryInfo) = getSafeArray dirInfo.GetFiles

let getSafeDirectories = InfoFromPath >> getSafeDirectoriesFromInfo
let getSafeFiles = InfoFromPath >> getSafeFilesFromInfo

let createFile ignoreReadonly path = 
    try 
        File.Create path
    with
    | :? System.UnauthorizedAccessException when ignoreReadonly -> 
        File.SetAttributes (path, FileAttributes.Normal)
        File.Create path