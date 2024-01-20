import { AsyncResult, ErrorType, Ok } from "functional-extensions"
import { CopyItem } from "../../requests/requests"

export const copyInfoToRemote = (_: string, __: string, items: CopyItem[]) => 
    AsyncResult.from(new Ok<CopyItem[], ErrorType>(
        items
            .filter(n => n.isDirectory))) 

// export const copyToRemote = async (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => {
//     return await request<IOErrorResult>("copyitemstoremote", {
//         path: sourcePath,
//         targetPath: targetPath,
//         items,
//         move
//     })
// }
