import { NullEngine } from "./nullengine"
import { RootEngine, ROOT_PATH } from "./root"

export type ItemResult = {
    items: any[]
    path: string
}

export type Engine = {
    isSuitable: (path: string|null|undefined)=>boolean
    getItems: (path: string|null|undefined, showHiddenItems?: boolean)=>Promise<ItemResult>

}

export function getEngine(folderId: string, path: string|null|undefined, current: Engine): {engine: Engine, changed: boolean} {
    if (current.isSuitable(path))
        return { engine: current, changed: false } 
    else if (!path || path == ROOT_PATH)         
        return { engine: new RootEngine(), changed: true } 
    return { engine: new NullEngine(), changed: true }
}