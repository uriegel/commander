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


type GetItemResult = RootItem[]

type IEngine = 
    abstract member Id : int with get
    abstract member getItems: getItems: GetItems -> Async<GetItemResult>
