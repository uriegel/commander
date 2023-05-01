import { CopyItem, IOErrorResult, request } from "../../requests/requests"

export const copyInfoToRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean): Promise<IOErrorResult> => {
    return {}
}

export const copyToRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
    return await request<IOErrorResult>("copyitemstoremote", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    })
}
