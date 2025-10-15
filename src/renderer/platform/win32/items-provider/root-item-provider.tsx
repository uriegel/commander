import IconName from "@/renderer/components/IconName"
import { IconNameType, RootItem } from "@/renderer/items-provider/items"
import { formatSize } from "@/renderer/items-provider/provider"
import { Column } from "virtual-table-react"

export const getColumns = () => [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Größe", isRightAligned: true }
] as Column[]
            
export const renderRow = (item: RootItem) => [
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
    formatSize(item.size || -1)
]
