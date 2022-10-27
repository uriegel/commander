module ExtendedRename

type RenameItem = {
    Name:    string
    NewName: string
}

type RenameItemsParam = {
    Items: RenameItem[]
    Path:  string
}

let renameItems (param: RenameItemsParam) = 
    ""