module Root

open FSharpTools

open Engine
open Utils

type Root () = 
    let getHomeDir = 
        let getHomeDir () = System.Environment.GetFolderPath(System.Environment.SpecialFolder.Personal)
        memoizeSingle getHomeDir

    let getItems (getItems: GetItems) = async {
        let! res = runCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE" ()
        let driveStrs = res |> String.splitChar '\n'
        let columnPositions = 
            let title = driveStrs[0]
            let getPart key = title |> String.indexOf key |> Option.defaultValue 0
            [|
                0
                getPart "NAME"
                getPart "LABEL"
                getPart "MOUNT"
                getPart "FSTYPE"
            |]
        let constructDrives driveString =
            let getString pos1 pos2 =
                driveString 
                |> String.substring2 columnPositions[pos1] (columnPositions[pos2]-columnPositions[pos1]) 
                |> String.trim
            let trimName name = 
                if name |> String.length > 2 && name[1] = '─' then
                    name |> String.substring 2
                else
                    name
            let mountPoint = getString 3 4

            {
                Description = getString 2 3
                Name        = getString 1 2 |> trimName
                Type        = 1 // TODO Drivetypes enum DriveType       
                MountPoint  = mountPoint
                IsMounted   = mountPoint |> String.length > 0 
                DriveType   = driveString |> String.substring columnPositions[4] |> String.trim
                Size        = 999 // TODO size
            }

        let filterDrives (n: string) = n[columnPositions[1]] > '~'
        let getItems () = 
                driveStrs
                |> Array.skip 1
                |> Array.filter filterDrives
                |> Array.map constructDrives

        let items = getItems ()
        let mounted = items |> Array.filter (fun n -> n.IsMounted)
        let unMounted = items |> Array.filter (fun n -> not n.IsMounted)
        return Array.concat [ 
            [| { 
                Description = "home"
                Name = "~"
                MountPoint = getHomeDir ()
                IsMounted = true
                Type = 1
                Size = 0
                DriveType = "" 
            } |]
            mounted
            unMounted
        ]
    }
    interface IEngine with
        member val Id = 1 with get
        member _.getItems (param: GetItems) = getItems param

