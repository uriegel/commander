import { type TableColumns } from "virtual-table-react"
import { getDrives } from "../requests/requests"
import { type EnterData, IItemsProvider, type OnEnterResult } from "./base-provider"
import { type Item, type RootItem } from "../requests/model"
import { getColumns, renderRow, deleteItems as rootDeleteItems } from "../platform/root-item-provider"

export const ROOT = "Root"

export class RootItemProvider extends IItemsProvider {
    getId() { return ROOT }
    readonly itemsSelectable = false

    getColumns(): TableColumns<Item> {
        return {
            columns: getColumns(),
            getRowClasses,
            renderRow
        }
    }
    
    async getItems(_: string, requestId: number) {
        const drives = await getDrives()
        const [mounted, unmounted] = drives.items.partition(n => (n as RootItem)?.isMounted == true)
        return {
            requestId,
            items: [...mounted, {
                name: "fav", description: "Favoriten", isDirectory: true, mountPoint: "fav", isMounted: true,
            }, {
                name: "remotes", description:  "Zugriff auf entfernte Geräte", isDirectory: true, mountPoint: "remotes", isMounted: true,
            }, ...unmounted],
            path: drives.path,
            dirCount: drives.items.length,
            fileCount: 0
        }
    }

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        const rootEnter = enterData.item as RootItem
        return {
            processed: false,
            pathToSet: rootEnter.mountPoint || rootEnter.mountPoint?.length || 0 > 0 ? rootEnter.mountPoint : enterData.item.name,
            mount: !rootEnter?.isMounted
        }
    }

    appendPath(_: string, subPath: string) {
        return subPath
    } 

    async deleteItems(path: string, items: Item[]) {
        return await rootDeleteItems(path, items)
    }

    constructor() { super() }
}

const getRowClasses = (item: Item) => {
    const notMounted = (item as RootItem).isMounted == false ? "notMounted" : null
    const full = ((item as RootItem).use?.substringUntil("%").parseInt() || 0) > 90 ? "full" : null
    return [notMounted, full].filterNone()
}
    
    

