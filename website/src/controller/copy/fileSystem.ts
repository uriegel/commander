import { CopyItem, webViewRequest } from "../../requests/requests"
import { ErrorType, Nothing } from "functional-extensions"
import { JobType } from "./copyController"

export const copyInfo = (sourcePath: string, targetPath: string, items: CopyItem[]) =>
    webViewRequest<CopyItem[], ErrorType>("copyitemsinfo", {
            path: sourcePath,
            targetPath: targetPath,
            items
    })

export const copy = (sourcePath: string, targetPath: string, items: CopyItem[], jobType: JobType) => 
    webViewRequest<Nothing, ErrorType>("copyitems", {
            path: sourcePath,
            targetPath: targetPath,
            items,
            jobType
    })

