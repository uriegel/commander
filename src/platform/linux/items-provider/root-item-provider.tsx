import IconName from "@/components/IconName"
import { IconNameType } from "@/items-provider/items"
import { formatSize } from "@/items-provider/provider"
import { RootItem } from "@/requests/model"
import { Column } from "virtual-table-react"

export const getColumns = () => [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Mountpoint" },
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
        : item.type == "REMOVABLE"
        ? IconNameType.RootEjectable
        : IconNameType.Root
    } />),
    item.description ?? "",
    item.mountPoint ?? "",
    formatSize(item.size || -1)
]
