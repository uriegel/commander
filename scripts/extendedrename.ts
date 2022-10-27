import { VirtualTable } from "virtual-table-component"
import { DialogBox, Result } from "web-dialog-box"
import { ExtendedRenameDialog } from "./components/extendedrename"
import { FolderItem } from "./components/folder"
import { insertArrayItem, removeArrayItem } from "./functional"
import { CheckExtendedRenameResult, EngineType, Nothing, request } from "./requests"

const dialog = document.querySelector('dialog-box') as DialogBox    
const extendedRenameDialog = document.getElementById("extended-rename") as ExtendedRenameDialog

export type ExtendedRename = {
    selectionChanged: (items: FolderItem[]) => void
    rename: (table: VirtualTable<FolderItem>, path: string) => Promise<boolean>
}

function init() {
    return {
        selectionChanged,
        rename
    }
}

function selectionChanged(items: FolderItem[]) {
    const info = extendedRenameDialog.getExtendedInfos()!
    items.reduce((p, n, i) => {
        n.newName = n.isSelected && !n.isDirectory ? `${info.prefix}${p.toString().padStart(info.digits, '0')}` : ""
        return p + (n.isSelected && !n.isDirectory ? 1 : 0)
    }, info.start ?? 0)
}

async function rename(table: VirtualTable<FolderItem>, path: string) {
    const items = table.items.filter(n => n.isSelected)
    if (items.length > 0) {
        await request<Nothing>("renameitems", {
            path,
            items: items.map(n => ({
                name: n.name,
                newName: n.newName!
            }))
        })
        return true
    }
    else 
        return false
}

export async function extendedRename(current: ExtendedRename | null, folderId: string, engineType: EngineType, table: VirtualTable<FolderItem>, setFocus: ()=>void) {
    let renameObject = current
    let result = await request<CheckExtendedRenameResult>("checkextendedrename", { engineType }) 
    if (result.result) {
        extendedRenameDialog.initialize()
        const res = await dialog.show({
            extended: "extended-rename",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })    
        setFocus()
        if (res.result == Result.Ok) {
            extendedRenameDialog.save()
            if (current == null && extendedRenameDialog.isActivated) {
                const columns = table.getColumns()
                const newcolumns = insertArrayItem(columns, 1, {
                    name: "Neuer Name",
                    render(td, item) {
                        td.innerHTML = item.newName ?? ""
                    }
                })
                table.setColumns(newcolumns, `${folderId}-extendedrename`)
                renameObject = init()
            }
            if (current != null && !extendedRenameDialog.isActivated) {
                renameObject = null
                const columns = table.getColumns()
                const newcolumns = removeArrayItem(columns, 1)
                table.setColumns(newcolumns, `${folderId}-${EngineType.Directory}`)

            }    
            selectionChanged(table.items)
            table.refresh()
        }
    }
    return renameObject
}


