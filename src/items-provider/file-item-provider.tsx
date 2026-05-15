import { type TableColumns } from "virtual-table-react"
import { type EnterData, IItemsProvider, type OnEnterResult } from "./base-provider"
import { getSelectedItemsText } from "./provider"
import { createFolderRequest, deleteRequest, getFiles, mountRequest, onEnter, renameRequest } from "../requests/requests"
import { type DialogHandle, ResultType } from "web-dialog-react"
import { retryOnErrorAsync } from "functional-extensions"
import { type DirectoryItem, type Item } from "../requests/model"
import { appendPath, getColumns, onGetItemsError, renderRow, sortVersion } from "../platform/file-item-provider"

export const FILE = "File"

export class FileItemProvider extends IItemsProvider {
    getId() { return FILE }
    readonly itemsSelectable = true

    getColumns(): TableColumns<Item> {
        return {
            columns: getColumns(),
            getRowClasses,
            draggable: true,
            renderRow
        }
    }
    
    async getItems(folderId: string, requestId: number, path: string, showHidden?: boolean, mount?: boolean, 
        dialog?: DialogHandle, setErrorText?: (msg: string)=>void) {

        if (mount) {
            const result = await mountRequest(path)
            path = result.path
        }
            
        const result = await retryOnErrorAsync(async () => await getFiles(folderId, requestId, path, showHidden), 
            e => onGetItemsError(e, path, dialog, setErrorText))
        return {
            requestId,
            items: [super.getParent(), ...result.items as DirectoryItem[]],
            path: result.path,
            dirCount: result.dirCount,
            fileCount: result.fileCount
        }
    }

    appendPath(path: string, subPath: string) {
        return appendPath(path, subPath)
    } 

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        if (!enterData.item.isDirectory) {
            await onEnter( /*id: enterData.id ?? ""*/ enterData.item.name, enterData.path)
            return {
                processed: true
            }
        }
        else
            return {
                processed: false,
                pathToSet: appendPath(enterData.path, enterData.item.name),
                latestPath: enterData.item.isParent ? extractSubPath(enterData.path) : undefined 
            }
    }

    sort(items: Item[], sortIndex: number, sortDescending: boolean, sortDirs = false): Item[] {
        return this.sortItems(items, this.getSortFunction(sortIndex, sortDescending), sortDirs)
    }

    getSortFunction = (index: number, descending: boolean) => {
        const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
        const sf = index == 0
            ? (a: Item, b: Item) => a.name.localeCompare(b.name) 
            : index == 1
                ? (a: Item, b: Item) => {	
                    const aa = (a as DirectoryItem).exifData?.dateTime ? (a as DirectoryItem).exifData?.dateTime : (a as DirectoryItem).time || ""
                    const bb = (b as DirectoryItem).exifData?.dateTime ? (b as DirectoryItem).exifData?.dateTime : (b as DirectoryItem).time || ""
                    return aa!.localeCompare(bb!) 
                } 
            : index == 2
            ? (a: Item, b: Item) => (a.size || 0) - (b.size || 0)
            : index == 3
            ? sortVersion
            : index == 10
                        ? (a: Item, b: Item) => a.name.getFileExtension().localeCompare(b.name.getFileExtension()) 
            : undefined
        
        return sf
            ? (a: Item, b: Item) => ascDesc(sf(a, b))
            : undefined
    }

    async deleteItems(path: string, items: Item[], dialog: DialogHandle, backgroundAction: boolean, setErrorText: (msg: string)=>void) { 
        if (items.length == 0)
            return false
        if (backgroundAction) {
            setErrorText("Eine Hintergrundaktion ist bereits am Laufen!")
            return false
        }        
        const res = await dialog.show({
            text: `Möchtest Du ${getSelectedItemsText(items)} löschen?`,
            btnOk: true,
            btnCancel: true
        })
        if (res.result == ResultType.Cancel)
            return false
        await deleteRequest(path, items.map(n => n.name))
        return true
    }

    async renameItem(path: string, item: Item, dialog: DialogHandle, asCopy?: boolean) { 
        const getInputRange = () => {
            const pos = item.name.lastIndexOf(".")
            return (pos == -1)
                ? [0, item.name.length]
                : [0, pos]
        }
        
        const res = await dialog.show({
            text: asCopy ? "Kopie anlegen" : "Umbenennen",
            inputText: item.name,
            inputSelectRange: getInputRange(),
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })        
        if (res.result != ResultType.Ok || !res.input || item.name == res.input) 
            return ""       
        await renameRequest(path, item.name, res.input, asCopy)
        return res.input
    }

    async createFolder(path: string, item: Item, dialog: DialogHandle) { 
        const res = await dialog.show({
            text: "Neuen Ordner anlegen",
            inputText: !item.isParent ? item.name : "",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        if (res.result != ResultType.Ok || !res.input) 
            return ""
        await createFolderRequest(path, res.input)
        return res.input
    }

    constructor() { super() }
}

export const getRowClasses = (item: Item) => {
    return (item as DirectoryItem)?.isHidden
        ? ["hidden"]
        : []
}

function extractSubPath(path: string): string {
    return path.substring(path.lastIndexOfAny(["/", "\\"]))
}

