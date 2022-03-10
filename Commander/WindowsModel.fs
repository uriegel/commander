module PlatformModel

open Model

type RootItem = {
    Name:        string
    Description: string
    Size:        int64
    ItemType:    ItemType
    IsMounted:   bool
}
