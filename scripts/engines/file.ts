import { Platform } from "../platforms/platforms"
import { Engine, FolderItem, formatDateTime, formatSize, getExtension, ItemResult, PathResult } from "./engines"
import { ROOT_PATH } from "./root"
const fspath = window.require('path')
const { getFiles } = window.require('rust-addon')

export interface FileItem extends FolderItem {
    isHidden?: boolean
}

export class FileEngine implements Engine {

    constructor(private folderId: string) {}

    get currentPath() { return this._currentPath }
    private set currentPath(value: string) { this._currentPath = value }
    private _currentPath = ""

    isSuitable(path: string|null|undefined) { return Platform.isFileEnginePath(path) }
    
    async getItems(path: string|null = "", showHiddenItems?: boolean) {
        path = fspath.normalize(path).replace(":.", ":\\")
        var response = (getFiles(path) as FileItem[])
            .filter(n => showHiddenItems ? true : !n.isHidden)

        let items = [{
                name: "..",
                isNotSelectable: true,
                isDirectory: true,
            } as FileItem ]
            .concat(response.filter(n => n.isDirectory))
            .concat(response.filter(n => !n.isDirectory))
        if (items && items.length)
            this.currentPath = path!
        return { items, path } as ItemResult
    }

    getColumns() { 
        const widthstr = localStorage.getItem(`${this.folderId}-directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = Platform.adaptDirectoryColumns([{
            name: "Name",
            isSortable: true,
            sortIndex: 1,
            subItem: {
                name: "Ext."
            },            
            render: (td, item) => {
                const selector = item.name == ".." 
                    ? '#parentIcon' 
                    : item.isDirectory
                        ? '#folderIcon'
                        : '#fileIcon'
                if (selector != '#fileIcon') {
                    var t = document.querySelector(selector) as HTMLTemplateElement
                    td.appendChild(document.importNode(t.content, true))
                } else {
                    const img = document.createElement("img")
                    const ext = getExtension(item.name)
                    // TODO: Windows
                    //if (ext) {
                        // if (ext == "exe") {
                        //    img.src = `icon://${}`
                        // } else 
                        img.src = `icon://${ext}`
                        img.classList.add("image")
                        td.appendChild(img)
                    // } else {
                    //     var t = document.querySelector(selector)
                    //     td.appendChild(document.importNode(t.content, true))
                    // }
                }

                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            sortIndex: 2,
            render: (td, item) => {
                td.innerHTML = formatDateTime(item.exifTime || item.time)
                if (item.exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            sortIndex: 3,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.size)
                td.classList.add("rightAligned")
            }
        }])
        // if (extendedRename) 
        //     columns.splice(1, 0, { name: "Neuer Name", render: (td, item) => { td.innerHTML = item.newName || ""}})
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    getItemPath(item: FolderItem) { return fspath.join(this.currentPath, item.name) }
    
    async getPath(item: FolderItem, _: ()=>void) {
        return item.isDirectory 
        ? item.name != ".."
            ? { path: this.currentPath != "\\" ? this.currentPath + Platform.pathDelimiter + item.name : this.currentPath + item.name }
            : Platform.parentIsRoot(this.currentPath)  
                ? { path: ROOT_PATH }
                : this.getParentDir(this.currentPath) 
        : { }
    }

    private getParentDir(path: string): PathResult {
        let pos = path.lastIndexOf(Platform.pathDelimiter)
        let parent = pos ? path.substring(0, pos) : Platform.pathDelimiter
        return { path: parent, recentFolder: path.substring(pos + 1) }
    }

}