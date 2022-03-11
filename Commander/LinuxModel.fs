module PlatformModel

open Model

type RootItem = {
    Name:        string
    Description: string
    MountPoint:  string
    Size:        int64
    DriveType:   string
    ItemType:    ItemType
    IsMounted:   bool
    IsDirectory: bool
}
