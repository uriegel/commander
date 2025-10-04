import { TableColumns } from "virtual-table-react"
import { getDrives } from "../requests/requests"
import { IItemsProvider } from "./base-provider"
import { Item, RootItem } from "../items-provider/items"
import IconName, { IconNameType } from "../components/IconName"
import { formatSize } from "./provider"

export class RootItemProvider extends IItemsProvider {
    readonly id = "Root"

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
    
    async getItems(id: string) {

        // TODO compare reqId with reqId from the BaseProvider, if smaller cancel. Do this also after result

        const items = await getDrives()
        return {
            items,
            dirCount: items.length,
            fileCount: 0
        }
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
