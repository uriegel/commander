import { DialogHandle } from "web-dialog-react"
import { CopyItem, CopyItemsResult, IOErrorResult, request } from "../../requests/requests"

export const copyInfo = async (sourcePath: string, targetPath: string, items: CopyItem[]) => {
    return await request<CopyItemsResult>("copyitemsinfo", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move: false
    })
}

export const copy = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean, uacShown?: (uac: boolean)=>void, dialog?: DialogHandle|null) => {
    return await request<IOErrorResult>("copyitems", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    }, dialog, uacShown)
}
