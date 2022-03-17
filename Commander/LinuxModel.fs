module PlatformModel

type EnhancedItem = {
    Index:       int
    ExifTime:    System.DateTime option
}

type FolderEvent = 
    | EnhancedInfo of EnhancedItem[]
    | Nothing
