import { TableColumns } from "virtual-table-react"
import { getDrives } from "../requests/requests"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, RootItem } from "../items-provider/items"
import { getColumns, renderRow } from '@platform/items-provider/root-item-provider'

export const ROOT = "Root"

export class RootItemProvider extends IItemsProvider {
    readonly id = ROOT
    readonly itemsSelectable = false

    getColumns(): TableColumns<Item> {
        return {
            columns: getColumns(),
            getRowClasses,
            renderRow
        }
    }
    
    async getItems(_: string, requestId: number) {
        const result = await getDrives()
        return {
            requestId,
            items: result.items,
            path: result.path,
            dirCount: result.items.length,
            fileCount: 0
        }
    }

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        const rootEnter = enterData.item as RootItem
        return {
            processed: false,
            pathToSet: rootEnter.mountPoint || rootEnter.mountPoint?.length || 0 > 0 ? rootEnter.mountPoint : enterData.item.name,
            mount: !rootEnter?.mountPoint            
        }
    }

    appendPath(_: string, subPath: string) {
        return subPath
    } 

    constructor() { super() }
}

const getRowClasses = (item: RootItem) => 
    item.isMounted == false
        ? ["notMounted"]
        : []

