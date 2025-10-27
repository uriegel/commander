import { TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, FileItem, IconNameType } from "./items"
import IconName from "../components/IconName"
import { formatDateTime, formatSize, getSelectedItemsText } from "./provider"
import { createFolderRequest, deleteRequest, getFiles, mountRequest, onEnter, renameRequest } from "../requests/requests"
import { appendPath } from '@platform/items-provider/file-item-provider'
import { DialogHandle, ResultType } from "web-dialog-react"

export const FILE = "File"

export class FileItemProvider extends IItemsProvider {
    getId() { return FILE }
    readonly itemsSelectable = true

    getColumns(): TableColumns<Item> {
        return {
            columns: [
    	        { name: "Name", isSortable: true, subColumn: "Erw." },
		        { name: "Datum", isSortable: true },
                { name: "Größe", isSortable: true, isRightAligned: true }
            ],
            getRowClasses,
            renderRow
        }
    }
    
    async getItems(folderId: string, requestId: number, path: string, showHidden?: boolean, mount?: boolean) {

        if (mount) {
            const result = await mountRequest(path)
            path = result.path
        }
            
        const result = await getFiles(folderId, requestId, path, showHidden)
        return {
            requestId,
            items: [super.getParent(), ...result.items as FileItem[]],
            path: result.path,
            dirCount: result.dirCount,
            fileCount: result.fileCount
        }
    }

    appendPath(path: string, subPath: string) {
        return appendPath(path, subPath)
    } 

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
//        const fileEnter = enterData.item as FileItem

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

    sort(items: Item[], sortIndex: number, sortDescending: boolean): Item[] {
        return this.sortItems(items, this.getSortFunction(sortIndex, sortDescending))
    }

    getSortFunction = (index: number, descending: boolean) => {
        const ascDesc = (sortResult: number) => descending ? -sortResult : sortResult
        const sf = index == 0
            ? (a: FileItem, b: FileItem) => a.name.localeCompare(b.name) 
            : index == 1
                ? (a: FileItem, b: FileItem) => {	
                    const aa = a.exifData?.dateTime ? a.exifData?.dateTime : a.time || ""
                    const bb = b.exifData?.dateTime ? b.exifData?.dateTime : b.time || ""
                    return aa.localeCompare(bb) 
                } 
            : index == 2
            ? (a: FileItem, b: FileItem) => (a.size || 0) - (b.size || 0)
            : index == 10
                        ? (a: FileItem, b: FileItem) => a.name.getFileExtension().localeCompare(b.name.getFileExtension()) 
            : undefined
        
        return sf
            ? (a: FileItem, b: FileItem) => ascDesc(sf(a, b))
            : undefined
    }

    async deleteItems(path: string, items: Item[], dialog: DialogHandle) { 
        if (items.length == 0)
            return false
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
        // TODO if (controller.current?.id == "REMOTES") {
        //     if (await controller.current.rename(dialog, selected))
        //         refresh(false, n => n.name == res.input)
        //     return
        // }
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

export const getRowClasses = (item: FileItem) => {
    return item.isHidden
        ? ["hidden"]
        : []
}

const renderRow = (item: FileItem) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={item.iconPath} />),
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

function extractSubPath(path: string): string {
    return path.substring(path.lastIndexOfAny(["/", "\\"]))
}

