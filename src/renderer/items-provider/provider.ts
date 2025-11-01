import { isRoot } from '@platform/items-provider/provider'
import { IItemsProvider } from "./base-provider"
import { FILE, FileItemProvider } from "./file-item-provider"
import { ROOT, RootItemProvider } from "./root-item-provider"
import { Item } from './items'
import { EXTENDED_RENAME } from './extended-rename'
import { FAVORITES, FavoritesProvider } from './favorites-provider'
import { Remotes, RemotesItemProvider } from './remotes-provider'

export const getItemsProvider = (path?: string, recentProvider?: IItemsProvider): IItemsProvider => {
    if (isRoot(path))
        return recentProvider?.getId() == ROOT ? recentProvider : new RootItemProvider()
    else if (path == "fav")
        return recentProvider?.getId() == FAVORITES ? recentProvider : new FavoritesProvider()
    else if (path == "remotes")
        return recentProvider?.getId() == Remotes ? recentProvider : new RemotesItemProvider()
    else
        return recentProvider?.getId() == FILE || recentProvider?.getId() == EXTENDED_RENAME ? recentProvider : new FileItemProvider()
}

export const formatSize = (num?: number) => {
    if (num == undefined)
        return ""
    if (num == -1)
        return ""
    let sizeStr = num.toString()
    const sep = '.'
    if (sizeStr.length > 3) {
        const sizePart = sizeStr
        sizeStr = ""
        for (let j = 3; j < sizePart.length; j += 3) {
            const extract = sizePart.slice(sizePart.length - j, sizePart.length - j + 3)
            sizeStr = sep + extract + sizeStr
        }
        const strfirst = sizePart.substring(0, (sizePart.length % 3 == 0) ? 3 : (sizePart.length % 3))
        sizeStr = strfirst + sizeStr
    }
    return sizeStr    
}

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

export function formatDateTime(dateStr?: string) {
    if (!dateStr || (dateStr as string).startsWith && dateStr.startsWith("0001"))
        return ''
    const date = Date.parse(dateStr)
    return dateFormat.format(date) + " " + timeFormat.format(date)  
}

export const getSelectedItemsText = (items: Item[]) => {
    const dirs = items.filter(n => n.isDirectory)
    const files = items.filter(n => !n.isDirectory)
    return dirs.length == 1 && files.length == 0
        ? "das markierte Verzeichnis"
        : dirs.length > 1 && files.length == 0
        ? "die markierten Verzeichnisse"
        : dirs.length == 0 && files.length == 1
        ? "die markierte Datei"
        : dirs.length == 0 && files.length > 1
        ? "die markierten Dateien"
        : "die markierten Einträge"
}

