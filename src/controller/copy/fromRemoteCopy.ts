import { AsyncResult, ErrorType, Ok } from "functional-extensions"
import { CopyItem } from "../../requests/requests"

export const copyInfoFromRemote = (_: string, __: string, items: CopyItem[]) => 
    AsyncResult.from(new Ok<CopyItem[], ErrorType>(
        items
            .filter(n => n.isDirectory))) 

// export const copyFromRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
//     return await request<IOErrorResult>("copyitemsfromremote", {
//         path: sourcePath,
//         targetPath: targetPath,
//         items,
//         move
//     })
// }
