module Engine

[<CLIMutable>]
type GetItems = {
    Path:      string option
    EngineId:  int
}


// TODO Linux Windows
type RootItem = {
    Name:        string
    Description: string
    MountPoint:  string
    Size:        int64
    Type:        int
    DriveType:   string
    IsMounted:   bool
}

type Column = {
    Name: string
    Column: string
    RightAligned: bool
}

type GetItemResult = {
    Items: RootItem[]
    Path: string
    EngineId: int
    Columns: Column[] option
}

type IEngine = 
    abstract member Id : int with get
    abstract member getItems: getItems: GetItems -> Async<GetItemResult>
