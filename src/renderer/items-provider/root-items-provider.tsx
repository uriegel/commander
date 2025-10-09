import { TableColumns } from "virtual-table-react"
import { getDrives } from "../requests/requests"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, RootItem } from "../items-provider/items"
import IconName, { IconNameType } from "../components/IconName"
import { formatSize } from "./provider"

export const ROOT = "Root"

export class RootItemProvider extends IItemsProvider {
    readonly id = ROOT
    readonly itemsSelectable = false

    getColumns(): TableColumns<Item> {
        return {
            columns: [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Mountpoint" },
                { name: "Größe", isRightAligned: true }
            ],
            getRowClasses,
            renderRow
        }
    }
    
    async getItems() {

        // TODO compare reqId with reqId from the BaseProvider, if smaller cancel. Do this also after result

        const result = await getDrives()
        return {
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

const renderRow = (item: RootItem) => [
    (<IconName namePart={item.name} type={
        item.name == '~'
        ? IconNameType.Home
        // : item.name == REMOTES
        // ? IconNameType.Remote
        // : item.name == FAVORITES
        // ? IconNameType.Favorite
        : item.isEjectable ? IconNameType.RootEjectable : IconNameType.Root
    } />),
    item.description ?? "",
    item.mountPoint ?? "",
    formatSize(item.size || -1)
]
