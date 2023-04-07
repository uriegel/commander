import { CopyItem, IOErrorResult, request } from "../../requests/requests"

export const copy = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
    return await request<IOErrorResult>("copyitemsfromremote", {
        path: sourcePath,
        targetPath: targetPath,
        items,
        move
    })
}
