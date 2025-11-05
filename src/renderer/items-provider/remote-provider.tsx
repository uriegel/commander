import { TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, FileItem, IconNameType } from "./items"
import { formatDateTime, formatSize, getSelectedItemsText } from "./provider"
import { createRemoteFolderRequest, getRemoteFiles, onEnter, remoteDeleteRequest } from "../requests/requests"
import { DialogHandle, ResultType } from "web-dialog-react"
import IconName from "../components/IconName"

export const REMOTE = "REMOTE"

export class RemoteItemProvider extends IItemsProvider {
    getId() { return REMOTE }
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
    
    async getItems(folderId: string, requestId: number, path: string, showHidden?: boolean) {
        const result = await getRemoteFiles(folderId, requestId, path, showHidden)
        return {
            requestId,
            items: [super.getParent(), ...result.items as FileItem[]],
            path: result.path,
            dirCount: result.dirCount,
            fileCount: result.fileCount
        }
    }

    appendPath(path: string, subPath: string) {
        return path.endsWith("/") || subPath.startsWith('/')
            ? path + subPath
            : path + "/" + subPath
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
                pathToSet: this.appendPath(enterData.path, enterData.item.name),
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
        await remoteDeleteRequest(path, items.map(n => n.name))
        return true
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
        await createRemoteFolderRequest(path, res.input)
        return res.input
    }

    constructor() { super() }
}

export const getRowClasses = (item: FileItem) => {
    return item.isHidden
        ? ["hidden"]
        : []
}

function extractSubPath(path: string): string {
    return path.substring(path.lastIndexOfAny(["/", "\\"]))
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
