module Root
open Types

type Empty = { Nil: int }

type RootItem = {
    Name: string
    Description: string
    Size: int64
    MountPoint: string
    IsMounted: bool
    DriveType: string
}

let get (_: Empty) = 
    task {
        return { 
            Ok = Some [
                { Name = "home"; Description = "Das home"; Size = 23; MountPoint = "~"; IsMounted = true; DriveType = "drive" }
            ]
            Error = None}
        }

   
