module Directory 
open System
open System.IO
open FSharpTools
open FSharpTools.Functional
open Types
open System.Threading
open FSharpTools.ExifReader

type GetFiles = {
    Id: string 
    Path: string
    ShowHiddenItems: bool
    Mount: bool option
}

type GetFilesResult = {
    Items: DirectoryItem array
    Path: string
    DirCount : int
    FileCount: int
}

type DirectoryItemInfo = {
    Path: string
    Items: DirectoryItem array
}

type GetExtendedItems = {
    Id: string
    Items: string []
    Path: string
}

type CancelExtendedItems = {
    Id: string
}

type ExifData = {
    DateTime: DateTime option
    Latitude: double option
    Longitude: double option
}

type GetExtendedItemsResult = {
    ExifDatas: ExifData option array
    Path: string
}


let getFiles (input: GetFiles) = 

    let getDirectoryItem (info: IO.FileSystemInfo) = 
        match info with
        | :? DirectoryInfo as di -> createDirectoryItem di
        | :? FileInfo as fi -> createFileItem fi Directory.getIconPath
        | _ -> failwith "Either Directory nor File"

    let getFilesResult path (items: DirectoryItemInfo) = 
        {
            Items = items.Items
            Path = items.Path
            DirCount = items.Items |> Seq.filter (fun i -> i.IsDirectory) |> Seq.length
            FileCount = items.Items |> Seq.filter (fun i -> not i.IsDirectory) |> Seq.length
        }

    let filterHidden (info: DirectoryItem) = 
        input.ShowHiddenItems || not info.IsHidden

    task {
        let path = 
            if input.Mount = Some true then 
                Directory.mount input.Path
            else
                input.Path
        return 
            Directory.getFileSystemInfo path
            // TODO |> Validate
            |> Result.map (fun (info: FileSystemInfo) -> {
                                                                        Items = info.Items |> Array.map getDirectoryItem |> Array.filter filterHidden
                                                                        Path = info.Path 
                                                                    }
                                                                    |> sideEffect (fun n -> DirectoryWatcher.install input.Id n.Path)
                                                                    )  
            |> Result.map(getFilesResult path)
            // TODO map error
            |> Result.mapError exceptionToError
            |> toJsonResult
    }

let mutable private extendedInfoCancellations = Map.empty<string, CancellationTokenSource>

let getExtendedInfos (input: GetExtendedItems) = 
    extendedInfoCancellations.TryFind(input.Id)
    |> Option.iter (fun c -> c.Cancel())
    let cancel = new CancellationTokenSource()
    extendedInfoCancellations <- extendedInfoCancellations.Add(input.Id, cancel)

    let getExifDate (name: string) = 
        if cancel.IsCancellationRequested then
            None
        else
            let fillExif (reader: Reader) = 
                let date = 
                    reader 
                    |> getDateValue ExifTag.DateTimeOriginal
                    |> Option.orElse (reader |> getDateValue ExifTag.DateTime)
                let lat =                  
                    reader.getTagValue<double> ExifTag.GPSLatitude
                let lon =                  
                    reader.getTagValue<double> ExifTag.GPSLongitude
                if date.IsNone && lat.IsNone && lon.IsNone then
                    None
                else
                    Some
                        {
                            DateTime = date
                            Latitude = lat
                            Longitude = lon
                        }

            let readExif path = 
                path
                |> getExif
                |> Option.bind fillExif

            if name.EndsWith(".jpg", StringComparison.InvariantCultureIgnoreCase) || name.EndsWith(".png", StringComparison.InvariantCultureIgnoreCase) then
                input.Path
                |> Directory.attachSubPath name
                |> readExif
            else
                None

    task {
        return {
            Ok = Some { ExifDatas = (input.Items |> Array.map getExifDate); Path = input.Path }
            Err = None
        }
    }

let cancelExtendedInfos (input: CancelExtendedItems) = 
    extendedInfoCancellations.TryFind(input.Id)
    |> Option.iter (fun c -> c.Cancel())

    task {
        return {
            Ok = Some { Nil = None}
            Err = None
        }
    }
