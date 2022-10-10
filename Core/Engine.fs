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
| Rename       = 2
| Copy         = 3
| Move         = 4

type GetActionsTexts = {
    EngineType:      EngineType
    OtherEngineType: EngineType option
    Type:            ActionType
    Dirs:            int
    Files:           int
    Conflicts:       bool option
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

