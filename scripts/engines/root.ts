import { Platform } from "../platforms/platforms"
import { Engine } from "./engines"

export const ROOT_PATH = "root"

export type RootItem = {
    isMounted: boolean
    isNotSelectable?: boolean
}

export class RootEngine implements Engine {

    constructor(private platform: Platform) {}

    isSuitable(path: string|null|undefined) { return path == ROOT_PATH }
    
    async getItems(path: string|null|undefined, showHiddenItems?: boolean) {
        const rootitems = await this.platform.getDrives() as RootItem[]
        const mountedItems = rootitems.filter(n => n.isMounted)
        const unmountedItems = rootitems.filter(n => !n.isMounted)
        // const externals = {
        //     name: EXTERN,
        //     description: "Zugriff auf externe Geräte",
        //     isMounted: true
        // }
        const items = mountedItems
//            .concat(externals)
            .concat(unmountedItems)
            .map(n => {
                n.isNotSelectable = true
                return n
            })
        return  { items, path: ROOT_PATH }
    }
}