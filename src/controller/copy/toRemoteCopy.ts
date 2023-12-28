// import { CopyItem, CopyItemsResult, IOErrorResult, request } from "../../requests/requests"

// export const copyInfoToRemote = async (_: string, __: string, items: CopyItem[]): Promise<CopyItemsResult> => {
//     return {
//         infos: items.filter(n => n.isDirectory)
//     }
// }

// export const copyToRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
//     return await request<IOErrorResult>("copyitemstoremote", {
//         path: sourcePath,
//         targetPath: targetPath,
//         items,
//         move
//     })
// }
