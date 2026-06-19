import { type Column } from "virtual-table-react"
import IconName from "../../components/IconName"
import { IconNameType } from "../../items-provider/items"
import { formatSize } from "../../items-provider/provider"
import type { Item, RootItem } from "../../requests/model"
import { removeDrive } from "../../requests/requests"

export const linuxGetColumns = () => [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Mountpoint" },
                { name: "%", isRightAligned: true },
                { name: "Größe", isRightAligned: true }
] as Column[]
            
export const linuxRenderRow = (item: Item) => [
    (<IconName namePart={item.name} type={
        item.name == "remotes"
        ? IconNameType.Remote
        : item.name == "fav"
        ? IconNameType.Favorite
        : IconNameType.IconName
    } iconPath={(item as RootItem).iconName} />),
    (item as RootItem).description ?? "",
    (item as RootItem).mountPoint ?? "",
    (item as RootItem).use ?? "",
    formatSize(item.size || -1)
]

export const linuxDeleteItems = async (_: string, items: Item[]) => {
    const rootItems = items as RootItem[]
    if (items.length == 1 && rootItems[0].mountPoint && (rootItems[0].type == "REMOVABLE_USB" || rootItems[0].type == "HARDDRIVE_USB"))
        removeDrive(rootItems[0].mountPoint)
    return false
}

