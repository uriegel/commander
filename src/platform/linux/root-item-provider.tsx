import { type Column } from "virtual-table-react"
import IconName from "../../components/IconName"
import { IconNameType } from "../../items-provider/items"
import { formatSize } from "../../items-provider/provider"
import type { Item, RootItem } from "../../requests/model"

export const linuxGetColumns = () => [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Mountpoint" },
                { name: "Größe", isRightAligned: true }
] as Column[]
            
export const linuxRenderRow = (item: Item) => [
    (<IconName namePart={item.name} type={
        (item.name == "remotes")
            ? IconNameType.Remote
            : item.name == "fav"
                ? IconNameType.Favorite
                : IconNameType.IconName
    } iconPath={(item as RootItem).iconName} />),
    (item as RootItem).description ?? "",
    (item as RootItem).mountPoint ?? "",
    formatSize(item.size || -1)
]
