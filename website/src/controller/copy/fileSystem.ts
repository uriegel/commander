import { webViewRequest } from "../../requests/requests"
import { ErrorType, Nothing } from "functional-extensions"
import { CopyController, JobType } from "./copyController"
import { FolderViewItem } from "../../components/FolderView"

export type CopyItem = {
    name: string,
    size: number
}

export class FileSystemCopyController extends CopyController {
    // Get sizes from all sources
    // get sizes form targets if available
    // get exif from sources and targets if available (Windows)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async checkCopyItems(items: FolderViewItem[], _targetItems: FolderViewItem[], sourcePath: string, _targetPath: string) {
        //         return [items.filter(n => !n.isDirectory), targetItems.filter(n => !n.isDirectory)]
        return {
            items: [],
            conflicts: []
        }
    }
}
   

export const copyInfo = (sourcePath: string, targetPath: string, items: string[]) =>
    webViewRequest<string[], ErrorType>("copyitemsinfo", {
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

