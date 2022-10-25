import { VirtualTable } from "virtual-table-component"
import { DialogBox, Result } from "web-dialog-box"
import { ExtendedRenameDialog } from "./components/extendedrename"
import { FolderItem } from "./components/folder"
import { insertArrayItem } from "./functional"
import { CheckExtendedRenameResult, EngineType, request } from "./requests"

const dialog = document.querySelector('dialog-box') as DialogBox    

export type ExtendedRename = {
    switch: (folderId: string, engineType: EngineType, table: VirtualTable<FolderItem>, setFocus: ()=>void)=>Promise<void>
}

export function initExtendedRename() {
    return switchOff()
}

function switchOff() {
    return {
        switch: extendedRename
    }                   
}   

async function extendedRename(folderId: string, engineType: EngineType, table: VirtualTable<FolderItem>, setFocus: ()=>void) {
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
                const columns = table.getColumns()
                const newcolumns = insertArrayItem(columns, 1, {
                    name: "Neuer Name",
                    render(td, item) {
                        td.innerHTML = item.newName ?? ""
                    }
                })
                console.log("newcolumns", newcolumns)
                table.setColumns(newcolumns, `${folderId}-extendedrename`)
                table.items[3].newName = "NeuerName"
                table.refresh()
            // TODO: In Result flag if to switch
            // TODO: remove newname column when removing checked
            // TODO: sort index is broken after rename
            // TODO: extendedrename module, controlled by Selection changed, is either null or set with functions ?.set...
        }
    }
}

