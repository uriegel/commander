import { IItemsProvider } from "./base-provider"
import { FILE, FileItemProvider } from "./file-item-provider"
import { ROOT, RootItemProvider } from "./root-item-provider"

export const getItemsProvider = (path?: string, recentProvider?: IItemsProvider): IItemsProvider => {
    if (path == "root" || !path || path == "/..")
        return recentProvider?.id == ROOT ? recentProvider : new RootItemProvider()
    else
        return recentProvider?.id == FILE ? recentProvider : new FileItemProvider()
}

export const formatSize = (num?: number) => {
    if (!num)
        return "0"
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

