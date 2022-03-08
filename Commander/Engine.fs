module Engine

[<CLIMutable>]
type GetItems = {
    Path:     string
    EngineId: int
}

// TODO Linux Windows
type RootItem = {
    Description: string
    Name:        string
    Type:        int
    MountPoint:  string
    DriveType:   string
    IsMounted:   bool
    Size:        int64
}

type Column = {
    Name: string
    Column: string
    RightAligned: bool
}

type GetItemResult = {
    Items: RootItem[]
    Path: string
    Columns: Column[] option
}

type IEngine = 
    abstract member Id : int with get
    abstract member getItems: getItems: GetItems -> Async<GetItemResult>
