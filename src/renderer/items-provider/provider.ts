import { IItemsProvider } from "./base-provider"
import { RootItemProvider } from "./root-items-provider"

export const getItemsProvider = (path?: string, recentProvider?: IItemsProvider) : IItemsProvider => {
    return recentProvider || new RootItemProvider()
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
