import { NullEngine } from "./nullengine"

export type Engine = {
    getItems: (path: string|null|undefined, showHiddenItems?: boolean)=>Promise<any>
}

export function getEngine(folderId: string, path: string|null|undefined, current: Engine): {engine: Engine, changed: boolean} {
    return { engine: new NullEngine(), changed: true }
}