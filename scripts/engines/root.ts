import { VirtualTable } from "virtual-table-component"
import { Folder, FolderItem } from "../components/folder"
import { Platform } from "../platforms/platforms"
import { Engine, formatSize } from "./engines"
import { EXTERNALS_PATH } from "./externals"

export const ROOT_PATH = "root"
const EXTERNALS = "extern"

export interface RootItem extends FolderItem {
    isMounted: boolean
    isNotSelectable?: boolean
    description: string,
    size: number
}

export class RootEngine implements Engine {

    constructor(private folderId: string) {}

    get currentPath() { return ROOT_PATH }

    isSuitable(path: string|null|undefined) { return path == ROOT_PATH }
    
    async getItems(_: string|null|undefined, __?: boolean) {
        const rootitems = await Platform.getDrives() as RootItem[]
        const mountedItems = rootitems.filter(n => n.isMounted)
        const unmountedItems = rootitems.filter(n => !n.isMounted)
        const externals = {
            name: EXTERNALS,
            description: "Zugriff auf externe Geräte",
            isMounted: true,
            isDirectory: true,
            size: 0
        }
        const items = mountedItems
            .concat(externals)
            .concat(unmountedItems)
            .map(n => {
                n.isNotSelectable = true
                return n
            })
        return  { items, path: ROOT_PATH }
    }

    getColumns() { 
        const widthstr = localStorage.getItem(`${this.folderId}-root-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = Platform.adaptRootColumns([{
            name: "Name",
            render: (td, item) => {
                var t = (item.name != EXTERNALS 
                    ? item.name != "~" 
                    ? document.querySelector('#driveIcon') 
                    : document.querySelector('#homeIcon') 
                    : document.querySelector('#remoteIcon')) as HTMLTemplateElement
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "Bezeichnung",
            render: (td, item) => td.innerHTML = (item as RootItem).description
        }, {
            name: "Größe",
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize((item as RootItem).size)
                td.classList.add("rightAligned")
            }
        }])
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    getItemPath(item: FolderItem) { return item.name }
    
    async getPath(item: FolderItem, _: ()=>void) { 
        return { 
            path: item.name == EXTERNALS 
                ? EXTERNALS_PATH 
                : await Platform.getRootPath(item as RootItem) 
        } 
    }

    renderRow(item: FolderItem, tr: HTMLTableRowElement) {
        if (!(item as RootItem).isMounted)
            tr.style.opacity = "0.5"
        tr.ondragstart = null
        tr.ondrag = null
        tr.ondragend = null
    }

    saveWidths(widths: number[]) { localStorage.setItem(`${this.folderId}-root-widths`, JSON.stringify(widths)) }

    getSortFunction(column: number, isSubItem: boolean) { return null }
    disableSorting(table: VirtualTable<FolderItem>, disable: boolean) {}
    async addExtendedInfos(path: string|undefined|null, items: FolderItem[], refresh: ()=>void) {}
    async renameItem(item: FolderItem, folder: Folder) {}
    async deleteItems(items: FolderItem[], folder: Folder) {}
    async createFolder(suggestedName: string, folder: Folder) {}
}