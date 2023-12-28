import { CopyItem } from "../../requests/requests"
import { ErrorType, Nothing, jsonPost } from "functional-extensions"

export const copyInfo = (sourcePath: string, targetPath: string, items: CopyItem[]) =>
    jsonPost<CopyItem[], ErrorType>({
        method: "copyitemsinfo",
        payload: {
            path: sourcePath,
            targetPath: targetPath,
            items,
            move: false
        }
    })

export const copy = (sourcePath: string, targetPath: string, items: CopyItem[], move: boolean) => 
    jsonPost<Nothing, ErrorType>({
        method: "copyitems", 
        payload: {
            path: sourcePath,
            targetPath: targetPath,
            items,
            move
        }
    })

