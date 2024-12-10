import { FolderViewItem } from "../../components/FolderView"
import { webViewRequest } from "../../requests/requests"
import { CopyController, CopyItemResult } from "./copyController"

export class FileSystemCopyController extends CopyController {
    // Get sizes from all sources
    // get sizes form targets if available
    // get exif from sources and targets if available (Windows)

    async checkCopyItems(items: FolderViewItem[], _targetItems: FolderViewItem[], sourcePath: string, targetPath: string) {
        return await webViewRequest<CopyItemResult>("checkcopytoremoteitems", {
            items,
            path: sourcePath,
            targetPath
        })
    }
}
   

