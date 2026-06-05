import { type Column } from "virtual-table-react"
import IconName from "../../components/IconName"
import { IconNameType } from "../../items-provider/items"
import { formatSize } from "../../items-provider/provider"
import type { Item, RootItem } from "../../requests/model"

export const windowsGetColumns = () => [
                { name: "Name" },
                { name: "Bezeichnung" },
                { name: "Größe", isRightAligned: true }
] as Column[]
            
export const windowsRenderRow = (item: Item) => [
    (<IconName namePart={item.name} type={
        (item as RootItem).name == 'remotes'
        ? IconNameType.Remote
        : item.name == "fav"
        ? IconNameType.Favorite
        : IconNameType.IconName
    } />),
    (item as RootItem).description ?? "",
    formatSize(item.size || -1)
]
