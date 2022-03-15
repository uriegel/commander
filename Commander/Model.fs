module Model

open PlatformModel

type ItemType =
| Parent    = 1
| File      = 2
| Directory = 3
| Harddrive = 4
| Homedrive = 5

type DirectoryItem = {
    Name:        string
    Size:        int64
    ItemType:    ItemType
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        System.DateTime
}

type FolderEvent = 
    | EnhancedInfo of EnhancedItem[]
    | Nothing
