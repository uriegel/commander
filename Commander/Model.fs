module Model

type ItemType =
| Parent    = 1
| File      = 2
| Directory = 3
| Harddrive = 4
| Homedrive = 5
| Remotes   = 6

type DirectoryItem = {
    Index:       int
    Name:        string
    Size:        int64
    Selectable:  bool
    ItemType:    ItemType
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        System.DateTime
}

type RequestId = {
    mutable Id: int
}

type FileVersion = {
    Major: int
    Minor: int
    Patch: int
    Build: int
}

type EnhancedItem = {
    Index:    int
    ExifTime: System.DateTime option
    Version:  FileVersion option
}

type FolderEvent = 
    | EnhancedInfo of EnhancedItem[]
    | GetItemsFinished

