module Model

open PlatformModel

type ItemType =
| Parent    = 1
| File      = 2
| Directory = 3
| Harddrive = 4
| Homedrive = 5

type DirectoryItem = {
    Index:       int
    Name:        string
    Size:        int64
    ItemType:    ItemType
    IsDirectory: bool
    IconPath:    string option
    IsHidden:    bool
    Time:        System.DateTime
}

type RequestId = {
    mutable Id: int
}


