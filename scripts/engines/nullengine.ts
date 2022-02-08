import { Column } from "virtual-table-component"
import { Engine, FolderItem, ItemResult } from "./engines"

export class NullEngine implements Engine {
    currentPath = ""
    isSuitable(path: string|null|undefined) { return false }
    async getItems(path: string|null|undefined, showHiddenItems?: boolean) {
        return { items: [], path: "" } as ItemResult
    }
    getColumns() { return [] }
    adaptRootColumns(columns: Column[]) { return  [] }
    getItemPath(item: FolderItem) { return "" }
    async getPath(item: FolderItem, refresh: ()=>void) { return {} }
    renderRow(item: FolderItem, tr: HTMLTableRowElement) {}
    saveWidths(widths: number[]) { }
}