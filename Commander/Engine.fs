module Engine

[<CLIMutable>]
type GetItems = {
    Path:     string
    EngineId: int
}

type IEngine = 
    abstract member Id : int with get
    abstract member getItems: getItems: GetItems -> Async<string>
