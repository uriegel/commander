import { TableColumns } from "virtual-table-react"
import { EnterData, IItemsProvider, OnEnterResult } from "./base-provider"
import { Item, FileItem } from "./items"
import IconName, { IconNameType } from "../components/IconName"
import { formatDate, formatDateTime, formatSize } from "./provider"
import { getFiles } from "../requests/requests"

export const FILE = "File"

export class FileItemProvider extends IItemsProvider {
    readonly id = FILE
    // TODO only for testing
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
    
    async getItems(id: string) {

        // TODO compare reqId with reqId from the BaseProvider, if smaller cancel. Do this also after result

        const items = await getFiles()
        return {
            items,
            dirCount: items.length,
            fileCount: 0
        }
    }

    async onEnter(enterData: EnterData): Promise<OnEnterResult> {
        const fileEnter = enterData.item as FileItem

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
	(<span className={item.exifData?.dateTime ? "exif" : "" } >{formatDate(item?.exifData?.dateTime ?? item?.time)}</span>),
	formatSize(item.size)
]

