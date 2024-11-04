import { AsyncResult, ErrorType, Ok } from "functional-extensions"

export const copyInfoFromRemote = (_: string, __: string, items: string[]) => 
    AsyncResult.from(new Ok<string[], ErrorType>(
        items))
            //.filter(n => n.isDirectory))) 

