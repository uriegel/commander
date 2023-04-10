import { CopyItem, IOErrorResult, request } from "../../requests/requests"

export const copyToRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
    return await request<IOErrorResult>("copyitemstoremote", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    })
}
