namespace Native
#if Linux
module Root = 
    open FSharpTools
    open Types

    type RootItem = {
        Name: string
        Description: string
        Size: int64
        MountPoint: string
        IsMounted: bool
        DriveType: string
    }

    let get (_: Empty) = 

        let trimName (name: string) =
            if name.Length > 2 && name[1] = '─' then
                name |> String.substring 2
            else
                name

        let createRootItem (columnPositions: int array) (driveString: string) =       
            let getString pos1 pos2 = 
                driveString |> String.substring2 columnPositions[pos1] (columnPositions[pos2] - columnPositions[pos1])
                |> String.trim
            
            let mountPoint = 
                if driveString <> "home" then
                    getString 3 4 
                else
                    ""
            if driveString = "home" then
                {
                    Name = "~" 
                    Description = "home"
                    Size = 0
                    MountPoint = Directory.getHomeDir ()
                    IsMounted = true
                    DriveType = "" 
                }
            else {
                Name = getString 1 2 |> trimName
                Description = getString 2 3
                Size = getString 0 1 |> String.parseInt64 |> Option.defaultValue 0
                MountPoint = mountPoint
                IsMounted = mountPoint.Length > 0
                DriveType = driveString |> String.substring columnPositions[4] |> String.trim
            }

        async {
            let filterDrives (columnPositions: int array) drive = 
                drive = "home" || drive[columnPositions[1]] > '~'

            let! res = FSharpTools.Process.asyncRunCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE"
            let drivelines = res |> String.splitChar '\n'
            let titles = drivelines[0]
            let columnPositions = [|
                0
                titles.IndexOf("NAME")
                titles.IndexOf("LABEL")
                titles.IndexOf("MOUNT")
                titles.IndexOf("FSTYPE")
            |]

            return {
                Ok = Some
                    (drivelines
                        |> Seq.skip 1
                        |> Seq.append [|"home"|]
                        |> Seq.filter (filterDrives columnPositions)
                        |> Seq.map (createRootItem columnPositions)
                        |> Seq.sortBy (fun item -> (not item.IsMounted, if item.Name = "~" then "aaa" else item.Name.ToLower()))
                        |> Seq.toArray)
                Err = None
            }
        }|> Async.StartAsTask
    
#endif