import { TableColumns, TableRowItem } from "virtual-table-react";
import { createFileSystemController } from "./filesystem";

const dateFormat = Intl.DateTimeFormat("de-DE", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
})

const timeFormat = Intl.DateTimeFormat("de-DE", {
    hour: "2-digit",
    minute: "2-digit"
})

export enum ControllerType {
    Empty,
    FileSystem
}

export interface Controller {
    type: ControllerType
    getColumns: ()=>TableColumns
}

export const checkController = (path: string, controller: Controller|null):[boolean, Controller] => {
    return controller?.type == ControllerType.FileSystem
        ? [false, controller]
        : [true, createFileSystemController()]
}

export const createEmptyController = (): Controller => ({
    type: ControllerType.Empty,
    getColumns: () => ({
        columns: [],
        renderRow: p => [],
        measureRow: () => ""
    })
} )

export const makeTableViewItems = (items: TableRowItem[], withParent = true) => 
    (withParent
        ? [{ name: "..", index: 0 } as TableRowItem]
        : [] as TableRowItem[])
        .concat(items)
        .map((n, i) => ({ ...n, index: i }))

export function formatSize(size: number) {
    if (!size)
        return ""
    let sizeStr = size.toString()
    const sep = '.'
    if (sizeStr.length > 3) {
        var sizePart = sizeStr
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

export function formatDateTime(dateStr: string) {
    if (!dateStr || dateStr.startsWith("0001"))
        return ''
    const date = Date.parse(dateStr)
    return dateFormat.format(date) + " " + timeFormat.format(date)  
}

