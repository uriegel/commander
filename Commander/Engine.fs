module Engine

type EngineType =
| None =      0     
| Root =      1
| Directory = 2

type Item = { Name: string }

type GetItems = {
    Path:            string option
    Engine:          EngineType
    CurrentItem:     Item option
    ShowHiddenItems: bool
}

type ColumnsType = 
| Normal = 1
| Name   = 2
| Size   = 3  
| Time   = 4

type Column = {
    Name:   string
    Column: string
    Type:   ColumnsType   
}


