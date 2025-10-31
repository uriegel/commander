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
        item.type == 'HOME'
        ? IconNameType.Home
        : item.name == "remotes"
        ? IconNameType.Remote
        : item.name == "fav"
        ? IconNameType.Favorite
        : item.name == 'C:\\'
        ? IconNameType.RootWindows
        : item.type == "REMOVABLE"
        ? IconNameType.RootEjectable
        : IconNameType.Root
    } />),
    item.description ?? "",
    formatSize(item.size || -1)
]
