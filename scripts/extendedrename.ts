import { VirtualTable } from "virtual-table-component"
import { DialogBox, Result } from "web-dialog-box"
import { ExtendedRenameDialog } from "./components/extendedrename"
import { FolderItem } from "./components/folder"
import { insertArrayItem, removeArrayItem } from "./functional"
import { CheckExtendedRenameResult, EngineType, request } from "./requests"

const dialog = document.querySelector('dialog-box') as DialogBox    
const extendedRenameDialog = document.getElementById("extended-rename") as ExtendedRenameDialog

export type ExtendedRename = {
    selectionChanged: (items: FolderItem[])=>void
}

function init() {
    return {
        selectionChanged
    }
}

function selectionChanged(items: FolderItem[]) {
    const info = extendedRenameDialog.getExtendedInfos()!
    items.reduce((p, n, i) => {
        n.newName = n.isSelected && !n.isDirectory ? `${info.prefix}${p.toString().padStart(info.digits, '0')}` : ""
        return p + (n.isSelected && !n.isDirectory ? 1 : 0)
    }, info.start ?? 0)
}

export async function extendedRename(current: ExtendedRename | null, folderId: string, engineType: EngineType, table: VirtualTable<FolderItem>, setFocus: ()=>void) {
    let rename = current
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
                rename = init()
            }
            if (current != null && !extendedRenameDialog.isActivated) {
                rename = null
                const columns = table.getColumns()
                const newcolumns = removeArrayItem(columns, 1)
                table.setColumns(newcolumns, `${folderId}-${EngineType.Directory}`)

            }    
            selectionChanged(table.items)
            table.refresh()
        }
    }
    return rename
}


