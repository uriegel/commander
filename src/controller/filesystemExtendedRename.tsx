import { Controller, ControllerResult, ControllerType } from "./controller"
import '../extensions/extensions'
import { FolderViewItem } from "../components/FolderView"
import { DialogHandle, Result } from "web-dialog-react"
import ExtendedRename from "../components/ExtendedRename"
import { createFileSystemController, getFileSystemController } from "./filesystem"

export interface ExtendedRenameProps {
    prefix: string
    digits: number
    startNumber: number
}

// TODO Take RenderRow in column

export const createExtendedRenameFileSystemController = (controller: Controller): Controller => {
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
        extendedRename: (controller: Controller, dialog: DialogHandle|null) => extendedRename(controller, dialog, true),
        createFolder: controller.createFolder,
        deleteItems: controller.deleteItems,
    }
}

export const extendedRename = async (controller: Controller, dialog: DialogHandle|null, isExtended: boolean) => {
	const result = await dialog?.show({
		text: "Erweitertes Umbenennen",
		extension: ExtendedRename,
		extensionProps: {
			prefix: localStorage.getItem("extendedRenamePrefix") ?? "Bild",
			digits: localStorage.getItem("extendedRenameDigits")?.parseInt() ?? 3,
			startNumber: localStorage.getItem("extendedRenameStartNumber")?.parseInt() ?? 1
		} as ExtendedRenameProps,
		btnOk: true,
		btnCancel: true,
		defBtnOk: true
	})
	if (result?.result == Result.Ok) {
		const erp = result.props as ExtendedRenameProps
		localStorage.setItem("extendedRenamePrefix", erp.prefix)
		localStorage.setItem("extendedRenameDigits", erp.digits.toString())
		localStorage.setItem("extendedRenameStartNumber", erp.startNumber.toString())
    }
	if (result?.result == Result.Ok && !isExtended) 
		return createExtendedRenameFileSystemController(controller)
    else if (result?.result != Result.Ok && isExtended) 
		return createFileSystemController()
    else
		return null
}

