module Engine

type EngineType =
| None =      0     
| Root =      1
| Directory = 2
| Remotes =   3
| Android =   4

type InputItem = { Name: string }

[<CLIMutable>]
type FileRequest = { Path: string }

type GetItems = {
    FolderId:        string
    RequestId:       int
    Path:            string option
    Engine:          EngineType
    CurrentItem:     InputItem option
    ShowHiddenItems: bool
}

type ActionType = 
| Delete       = 0
| CreateFolder = 1

type GetActionsTexts = {
    EngineType: EngineType
    Type:       ActionType
    Dirs:       int
    files:      int
}

type GetFile = {
    Path:            string
    Engine:          EngineType
    CurrentItem:     InputItem
}

type FilePath = {
    Path: string
}

type ColumnsType = 
| Normal        = 1
| Name          = 2
| NameExtension = 3
| Size          = 4  
| Time          = 5
| Version       = 6

type Column = {
    Name:   string
    Column: string
    Type:   ColumnsType   
}

