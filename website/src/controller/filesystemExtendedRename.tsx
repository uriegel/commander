import { Controller, ControllerType, EnterData, OnEnterResult, showError } from "./controller"
import 'functional-extensions'
import { FolderViewItem } from "../components/FolderView"
import { DialogHandle, ResultType } from "web-dialog-react"
import ExtendedRename from "../components/dialogparts/ExtendedRename"
import { createFileSystemController } from "./filesystem"
import { Err, ErrorType, Nothing, Ok, nothing } from "functional-extensions"
import { IOError, webViewRequest } from "../requests/requests"

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
    onEnter: (enterData: EnterData) => 
        enterData.items.find(n => n.newName) == undefined
        ? controller.onEnter(enterData)
        : enterData.dialog.showDialog<Nothing, ErrorType>({
                text: "Umbenennungen starten?",
                btnOk: true,
                btnCancel: true
            }, res => res.result == ResultType.Ok
                ? new Ok(nothing)
                : new Err({ status: IOError.Dropped, statusText: "" }))
            .bind(() => rename(enterData)),
    sort: (items: FolderViewItem[], sortIndex: number, sortDescending: boolean) => {
        const sorted = controller.sort(items, sortIndex == 0 ? 0 : sortIndex - 1, sortDescending)
        onSelectionChanged(sorted)
        return sorted
    },
    itemsSelectable: true,
    appendPath: controller.appendPath,
    rename: controller.rename,
    extendedRename: (controller: Controller, dialog: DialogHandle) => extendedRename(controller, dialog, true),
    renameAsCopy: controller.renameAsCopy,
    createFolder: controller.createFolder,
    deleteItems: controller.deleteItems,
    onSelectionChanged,
    cleanUp: () => { }
})

export const extendedRename = (controller: Controller, dialog: DialogHandle, isExtended: boolean) => 
	dialog.showDialog({
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
    }, res => {
        if (res.result == ResultType.Ok) {
            localStorage.setItem("extendedRenamePrefix", res.props.prefix)
            localStorage.setItem("extendedRenameDigits", res.props.digits.toString())
            localStorage.setItem("extendedRenameStartNumber", res.props.startNumber.toString())
            return !isExtended
                ? new Ok<Controller, Nothing>(createExtendedRenameFileSystemController(controller)) 
                : new Err<Controller, Nothing>(nothing)
        } else
            return isExtended
                ? new Ok<Controller, Nothing>(createFileSystemController())
                : new Err<Controller, Nothing>(nothing)    
    })

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

const rename = (enterData: EnterData) => {
    if (enterData.selectedItems.length > 0) {
        const testItems = enterData.items
            ?.filter(n => !n.isDirectory)
            .map(n => n.isSelected ? n.newName?.toLowerCase() ?? "" : n.name.toLowerCase())
            ?? []
        if (new Set(testItems).size == testItems.length) {
            webViewRequest<Nothing, ErrorType>("renameitems", {
                    path: enterData.path,
                    items: enterData.selectedItems.map(n => ({
                        name: n.name,
                        newName: n.newName!
                    }))
            }).match(
                enterData.refresh,
                e => showError(e, enterData.setError))
        } else
            enterData.setError("Dateinamen nicht eindeutig")
    }
    return new Ok<OnEnterResult, ErrorType>({ processed: true })
}