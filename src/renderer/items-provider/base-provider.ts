import { TableColumns } from "virtual-table-react";
import { Item, ItemsResult } from "../items-provider/items"
import { DialogHandle } from "web-dialog-react";

export interface EnterData {
    id?: string
    path: string,
    item: Item, 
    selectedItems?: Item[]
    dialog?: DialogHandle
    otherPath?: string
}

export interface OnEnterResult {
    processed: boolean
    pathToSet?: string
    latestPath?: string
    mount?: boolean
    refresh?: boolean
}

export type SortFunction = (a: Item, b: Item) => number

export abstract class IItemsProvider {
    abstract getId(): string
    abstract readonly itemsSelectable: boolean

    abstract getColumns(): TableColumns<Item>
    abstract getItems(folderId: string, requestId: number, path?: string, showHidden?: boolean, mount?: boolean, 
        dialog?: DialogHandle, setErrorText?: (msg: string)=>void): Promise<ItemsResult>
    abstract onEnter(data: EnterData): Promise<OnEnterResult>
    abstract appendPath(path: string, subPath: string): string
    sort(items: Item[], _sortIndex: number, _sortDescending: boolean): Item[] { return items }
    onSelectionChanged(_items: Item[]) { }
    
    sortItems(folderItemArray: Item[], sortFunction?: SortFunction, sortDirs?: boolean) {
        const unsortedDirs = folderItemArray.filter(n => n.isDirectory || n.isParent)
        const dirs = sortDirs ? unsortedDirs.sort((a, b) => a.name.localeCompare(b.name)) : unsortedDirs
        let files = folderItemArray.filter(n => !n.isDirectory)
        files = sortFunction ? files.sort(sortFunction) : files
        return dirs.concat(files)
    }

    async deleteItems(_path: string, _items: Item[], _dialog: DialogHandle, _backgroundAction: boolean, _setErrorText: (msg: string)=>void) { return false }
    async renameItem(_path: string, _item: Item, _dialog: DialogHandle, _copy?: boolean) { return "" }
    async createFolder(_path: string, _item: Item, _dialog: DialogHandle) { return "" }

    getParent() {
        return {
            name: '..',
            isParent: true,
            isDirectory: true,
            size: -1
        }        
    }
}

