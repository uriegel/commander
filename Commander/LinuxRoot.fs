module Root

open Engine
open Giraffe
open Utils

type Root () = 
    let getItems (getItems: GetItems) = async {
        let t = runCmd "lsblk" "--bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE"
        return! t ()
    }
    interface IEngine with
        member val Id = 1 with get
        member __.getItems (param: GetItems) = getItems param

