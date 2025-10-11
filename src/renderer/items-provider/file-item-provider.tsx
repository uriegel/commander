import { TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, FileItem, IconNameType } from "./items"
import IconName from "../components/IconName"
import { formatDateTime, formatSize } from "./provider"
import { getFiles } from "../requests/requests"

export const FILE = "File"

export class FileItemProvider extends IItemsProvider {
    readonly id = FILE
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
        const result = await getFiles(folderId, requestId, path, showHidden)
        return {
            requestId,
            items: [{
                name: '..',
                isParent: true,
                isDirectory: true,
                size: -1
            }, ...result.items as FileItem[]],
            path: result.path,
            dirCount: result.dirCount,
            fileCount: result.fileCount
        }
    }

    appendPath(path: string, subPath: string) {
        return path.appendPath(subPath)
    } 

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
//        const fileEnter = enterData.item as FileItem

        if (!enterData.item.isDirectory) {
            // TODO await onEnter({ id: enterData.id ?? "", name: enterData.item.name, path: enterData.path })
            return {
                processed: true
            }
        }
        else
            return {
                processed: false,
                pathToSet: enterData.path.appendPath(enterData.item.name),
                latestPath: enterData.item.isParent ? enterData.path.extractSubPath() : undefined 
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
            ? (a: FileItem, b: FileItem) => a.name.getExtension().localeCompare(b.name.getExtension()) 
            : undefined
        
        return sf
            ? (a: FileItem, b: FileItem) => ascDesc(sf(a, b))
            : undefined
    }

    constructor() { super() }
}

const getRowClasses = (item: FileItem) => {
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
		iconPath={item.name.getExtension()} />),
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDateTime(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

