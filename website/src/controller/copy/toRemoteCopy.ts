import { AsyncResult, ErrorType, Ok } from "functional-extensions"

export const copyInfoToRemote = (_: string, __: string, items: string[]) => 
    AsyncResult.from(new Ok<string[], ErrorType>(
        items))
            //.filter(n => n.isDirectory))) 

