import { Controller, ControllerResult, ControllerType } from "./controller"
import '../extensions/extensions'
import { FolderViewItem } from "../components/FolderView"

export interface ExtendedRenameProps {
    prefix: string
    digits: number
    startNumber: number
}

// TODO Take RenderRow in column
// TODO OK in FilesystemExtendedRename: do not change controller
// TODO Cancel in FilesystemExtendedRename: change controller back

export const createFileSystemController = (controller: Controller): Controller => {
    return {
        type: ControllerType.FileSystem,
        id: "file-extendedrename",
        getColumns: () => {
            const cols = controller.getColumns()
            cols.columns = cols.columns.insert(1, { name: "Neuer Name", isSortable: true })
            cols.renderRow = (item: FolderViewItem) => {
                var items = controller.getColumns().renderRow(item)
                return items.insert(1, "Neuer Name")
            }
            return cols
        },
        getExtendedItems: controller.getExtendedItems,
        setExtendedItems: controller.setExtendedItems,
        getItems: controller.getItems,
        onEnter: controller.onEnter,
        sort: controller.sort,
        itemsSelectable: true,
        appendPath: controller.appendPath,
        rename: controller.rename,
        extendedRename: controller.extendedRename,
        createFolder: controller.createFolder,
        deleteItems: controller.deleteItems,
    }
}
