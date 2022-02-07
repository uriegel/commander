import { Column } from "virtual-table-component"
import { NullEngine } from "./nullengine"
import { RootEngine, ROOT_PATH } from "./root"

export type ItemResult = {
    items: any[]
    path: string
}

export type Engine = {
    isSuitable: (path: string|null|undefined)=>boolean
    getItems: (path: string|null|undefined, showHiddenItems?: boolean)=>Promise<ItemResult>
    getColumns(): Column[]
        
}

export function getEngine(folderId: string, path: string|null|undefined, current: Engine): {engine: Engine, changed: boolean} {
    if (current.isSuitable(path))
        return { engine: current, changed: false } 
    else if (!path || path == ROOT_PATH)         
        return { engine: new RootEngine(folderId), changed: true } 
    return { engine: new NullEngine(), changed: true }
}

export function formatSize(size: number) {
    if (!size)
        return ""
    let sizeStr = size.toString()
    const sep = '.'
    if (sizeStr.length > 3) {
        var sizePart = sizeStr
        sizeStr = ""
        for (let j = 3; j < sizePart.length; j += 3) {
            const extract = sizePart.slice(sizePart.length - j, sizePart.length - j + 3)
            sizeStr = sep + extract + sizeStr
        }
        const strfirst = sizePart.substring(0, (sizePart.length % 3 == 0) ? 3 : (sizePart.length % 3))
        sizeStr = strfirst + sizeStr
    }
    return sizeStr    
}