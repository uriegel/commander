module Engine

open PlatformModel

type EngineType =
| None =      0     
| Root =      1
| Directory = 2

[<CLIMutable>]
type GetItems = {
    Path:    string option
    Engine:  EngineType
}

type ColumnsType = 
| Normal = 1
| Name   = 2
| Size   = 3  

type Column = {
    Name:   string
    Column: string
    Type:   ColumnsType   
}

type GetItemResult = {
    Items:   RootItem[]
    Path:    string
    Engine:  EngineType
    Columns: Column[] option
}

type IEngine = 
    abstract member Id : EngineType with get
    abstract member getItems: getItems: GetItems -> Async<GetItemResult>
