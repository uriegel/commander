import { CopyItem, IOErrorResult, request } from "../../requests/requests"

export const copyInfo = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
    return await request<IOErrorResult>("copyitemsinfo", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    })
}

export const copy = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
    return await request<IOErrorResult>("copyitems", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    })
}
