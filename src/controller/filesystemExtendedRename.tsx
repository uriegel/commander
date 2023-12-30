import { Controller, ControllerType, EnterData, checkResult } from "./controller"
import 'functional-extensions'
import { FolderViewItem } from "../components/FolderView"
import { DialogHandle, ResultType } from "web-dialog-react"
import ExtendedRename from "../components/dialogparts/ExtendedRename"
import { createFileSystemController } from "./filesystem"
import { IOErrorResult, request } from "../requests/requests"

export interface ExtendedRenameProps {
    prefix: string
    digits: number
    startNumber: number
}

export const createExtendedRenameFileSystemController = (controller: Controller): Controller => ({
    type: ControllerType.FileSystem,
    id: "file-extendedrename",
    getColumns: () => {
        const cols = controller.getColumns()
        cols.columns = cols.columns.insert(1, { name: "Neuer Name", isSortable: false })
        cols.renderRow = (item: FolderViewItem) => {
            const items = controller.getColumns().renderRow(item)
            return items.insert(1, item.newName ?? "")
        }
        return cols
    },
    getExtendedItems: controller.getExtendedItems,
    setExtendedItems: controller.setExtendedItems,
    cancelExtendedItems: controller.cancelExtendedItems,
    getItems: controller.getItems,
    updateItems: controller.updateItems,
    getPath: controller.getPath,
    onEnter: async (enterData: EnterData) => {
        
        if (enterData.items?.find(n => n.newName) == undefined)
            return controller.onEnter(enterData)
        else {
            if ((await enterData.dialog?.show({
                text: "Umbenennungen starten?",
                btnOk: true,
                btnCancel: true
            }))?.result == ResultType.Ok)
                rename(enterData)
        }
        return { processed: true }
    },
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => {
        const sorted = controller.sort(items, sortIndex == 0 ? 0 : sortIndex - 1, sortDescending)
        onSelectionChanged(sorted)
        return sorted
    },
    itemsSelectable: true,
    appendPath: controller.appendPath,
    rename: controller.rename,
    extendedRename: (controller: Controller, dialog: DialogHandle | null) => extendedRename(controller, dialog, true),
    renameAsCopy: async()=>null,
    createFolder: controller.createFolder,
    deleteItems: controller.deleteItems,
    onSelectionChanged,
    cleanUp: () => { }
})

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
	if (result?.result == ResultType.Ok) {
		const erp = result.props as ExtendedRenameProps
		localStorage.setItem("extendedRenamePrefix", erp.prefix)
		localStorage.setItem("extendedRenameDigits", erp.digits.toString())
		localStorage.setItem("extendedRenameStartNumber", erp.startNumber.toString())
    }
	if (result?.result == ResultType.Ok && !isExtended) 
		return createExtendedRenameFileSystemController(controller)
    else if (result?.result != ResultType.Ok && isExtended) 
		return createFileSystemController()
    else
		return null
}

const onSelectionChanged = (items: FolderViewItem[]) => {
    const prefix = localStorage.getItem("extendedRenamePrefix") ?? "Bild"
    const digits = localStorage.getItem("extendedRenameDigits")?.parseInt() ?? 3
    const startNumber = localStorage.getItem("extendedRenameStartNumber")?.parseInt() ?? 1
    items.reduce((p, n) => {
        n.newName = n.isSelected && !n.isDirectory
            ? `${prefix}${p.toString().padStart(digits, '0')}.${n.name.split('.').pop()}`
            : null
        return p + (n.isSelected && !n.isDirectory ? 1 : 0)
    }, startNumber)
} 

const rename = async (enterData: EnterData) => {
    if (enterData.selectedItems && enterData.selectedItems.length > 0) {
        const testItems = enterData.items  
            ?.filter(n => !n.isDirectory)
            .map(n => n.isSelected ? n.newName?.toLowerCase() ?? "" : n.name.toLowerCase()) 
            ?? []
        if (new Set(testItems).size == testItems.length) {
            const result = await request<IOErrorResult>("renameitems", {
                path: enterData.path,
                items: enterData.selectedItems.map(n => ({
                    name: n.name,
                    newName: n.newName!
                }))
            })
            if (await checkResult(enterData.dialog, null, result.error) && enterData.refresh) 
                enterData.refresh()
        } else {
            (async () => await enterData.dialog?.show({
                text: "Dateinamen nicht eindeutig",
                btnOk: true
            }))()
        }
        return true            
    } else
        return false
}