import { CopyItem } from "../../requests/requests"
import { ErrorType, Nothing, jsonPost } from "functional-extensions"
import { JobType } from "./copyController"

export const copyInfo = (sourcePath: string, targetPath: string, items: CopyItem[]) =>
    jsonPost<CopyItem[], ErrorType>({
        method: "copyitemsinfo",
        payload: {
            path: sourcePath,
            targetPath: targetPath,
            items
        }
    })

export const copy = (sourcePath: string, targetPath: string, items: CopyItem[], jobType: JobType) => 
    jsonPost<Nothing, ErrorType>({
        method: "copyitems", 
        payload: {
            path: sourcePath,
            targetPath: targetPath,
            items,
            jobType
        }
    })

