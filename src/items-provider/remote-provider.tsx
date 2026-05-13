import { type TableColumns } from "virtual-table-react"
import { type EnterData, IItemsProvider, type OnEnterResult } from "./base-provider"
import { IconNameType } from "./items"
import { formatDateTime, formatSize, getSelectedItemsText } from "./provider"
import { createRemoteFolderRequest, getRemoteFiles, onEnter, remoteDeleteRequest } from "../requests/requests"
import { type DialogHandle, ResultType } from "web-dialog-react"
import IconName from "../components/IconName"
import { type DirectoryItem, type Item } from "../requests/model"

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
            items: [super.getParent(), ...result.items as DirectoryItem[]],
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
            ? (a: Item, b: Item) => a.name.localeCompare(b.name) 
            : index == 1
                ? (a: Item, b: Item) => {	
                    const aa = (a as DirectoryItem).exifData?.dateTime ? (a as DirectoryItem).exifData?.dateTime : (a as DirectoryItem).time || ""
                    const bb = (b as DirectoryItem).exifData?.dateTime ? (b as DirectoryItem).exifData?.dateTime : (b as DirectoryItem).time || ""
                    return aa!.localeCompare(bb!) 
                } 
            : index == 2
            ? (a: Item, b: Item) => (a.size || 0) - (b.size || 0)
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

export const getRowClasses = (item: Item) => {
    return (item as DirectoryItem).isHidden
        ? ["hidden"]
        : []
}

function extractSubPath(path: string): string {
    return path.substring(path.lastIndexOfAny(["/", "\\"]))
}

const renderRow = (item: Item) => [
	(<IconName namePart={item.name} type={
			item.isParent
			? IconNameType.Parent
			: item.isDirectory
			? IconNameType.Folder
			: IconNameType.File}
		iconPath={(item as DirectoryItem).iconPath} />),
    (<span className={(item as DirectoryItem).exifData?.dateTime ? "exif" : ""} >
        {formatDateTime((item as DirectoryItem).exifData?.dateTime ?? (item as DirectoryItem).time)}
    </span>),
	formatSize(item.size)
]
