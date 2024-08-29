module Root
open Types
open System.IO

type RootItem = {
    Name: string
    Description: string option
    Size: int64 option
    IsMounted: bool
}

let get (_: Empty) = task {

    let createRootItem (driveInfo: DriveInfo) = 
        {
            Name = driveInfo.Name
            Description = if driveInfo.IsReady then Some driveInfo.VolumeLabel else None
            Size = if driveInfo.IsReady then Some driveInfo.TotalSize else None
            IsMounted = driveInfo.IsReady
        }

    let appendServiceItem items = 
        Seq.append items [| { Name = "services"; Description = None; Size = None; IsMounted = true } |]

    return  {
            Ok = Some
                    (DriveInfo.GetDrives ()
                    |> Seq.map createRootItem
                    |> Seq.sortBy (fun item -> (not item.IsMounted, item.Name))
                    |> appendServiceItem
                    |> Seq.toArray)
            Err = None
        }
}


