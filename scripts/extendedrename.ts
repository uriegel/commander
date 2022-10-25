import { VirtualTable } from "virtual-table-component"
import { DialogBox, Result } from "web-dialog-box"
import { ExtendedRenameDialog } from "./components/extendedrename"
import { FolderItem } from "./components/folder"
import { insertArrayItem, removeArrayItem } from "./functional"
import { CheckExtendedRenameResult, EngineType, request } from "./requests"

const dialog = document.querySelector('dialog-box') as DialogBox    

export type ExtendedRename = {
    dummy: ()=>void
}

function init() {
    return {
        dummy
    }
}

function dummy() {

}

export async function extendedRename(current: ExtendedRename | null, folderId: string, engineType: EngineType, table: VirtualTable<FolderItem>, setFocus: ()=>void) {
    let rename = current
    let result = await request<CheckExtendedRenameResult>("checkextendedrename", { engineType }) 
    if (result.result) {
        const extendedRename = document.getElementById("extended-rename") as ExtendedRenameDialog
        extendedRename.initialize()
        const res = await dialog.show({
            extended: "extended-rename",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })    
        setFocus()
        if (res.result == Result.Ok) {
            extendedRename.save()
            if (current == null && extendedRename.isActivated) {
                const columns = table.getColumns()
                const newcolumns = insertArrayItem(columns, 1, {
                    name: "Neuer Name",
                    render(td, item) {
                        td.innerHTML = item.newName ?? ""
                    }
                })
                table.setColumns(newcolumns, `${folderId}-extendedrename`)
                table.items[3].newName = "NeuerName"
                rename = init()
            }
            if (current != null && !extendedRename.isActivated) {
                rename = null
                const columns = table.getColumns()
                const newcolumns = removeArrayItem(columns, 1)
                table.setColumns(newcolumns, `${folderId}-${EngineType.Directory}`)

            }    
            table.refresh()
            
            // TODO: sort index is broken after rename
            // TODO: extendedrename module, controlled by Selection changed, is either null or set with functions ?.set...
        }
    }
    return rename
}

