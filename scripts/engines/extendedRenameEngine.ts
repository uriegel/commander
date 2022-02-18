import { ExtendedInfo } from "../components/extendedrename"
import { Folder, FolderItem } from "../components/folder"
import { Platform } from "../platforms/platforms"
import { EngineId, getExtension } from "./engines"
import { FileEngine } from "./file"

interface RenameItem extends FolderItem {
    newName?: string
}

export class ExtendedRenameEngine extends FileEngine {

    constructor(folderId: string, private extendedInfo: ExtendedInfo) {
        super(EngineId.Files, `${folderId}-external`)
    }

    override isSuitable(path: string|null|undefined, extendedRename?: ExtendedInfo) { return Platform.isFileEnginePath(path) && extendedRename !== null }

    override getColumns() { 
        const widthstr = localStorage.getItem(`${this.folderId}-directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []

        let columns = super.getColumns()
        columns.splice(1, 0, { name: "Neuer Name", render: (td, item) => { td.innerHTML = (item as RenameItem).newName || ""}})
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    override beforeRefresh(items: FolderItem[]) {
        const formatNewName = (n: RenameItem, i: number) => { 
            const ext = getExtension(n.name)
            n.newName = 
                `${this.extendedInfo!.prefix}${String(i + this.extendedInfo!.start!).padStart(this.extendedInfo!.digits, '0')}${ext}`
        }
    
        items
            .filter(n => !n.isSelected)
            .forEach(n => (n as RenameItem).newName = "")
        items
            .filter(n => n.isSelected)
            .forEach(formatNewName)
    }

    override async renameItem(_: FolderItem, folder: Folder) {
        folder.reloadItems(true)
    }

}
