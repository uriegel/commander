import { Column, VirtualTable } from "virtual-table-component"
import { Result } from "web-dialog-box"
import { dialog } from "../commander"
import { Folder, FolderItem } from "../components/folder"
import { Engine } from "./engines"
import { ROOT_PATH } from "./root"

export const EXTERNALS_PATH = "externals"

enum ItemType {
    Parent,
    Item,
    Add
}

interface Item extends FolderItem {
    type?: ItemType
    ip?: string
}

export class ExternalsEngine implements Engine {
    constructor(private folderId: string) { }

    get currentPath() { return EXTERNALS_PATH }

    isSuitable(path: string | null | undefined) { return path == EXTERNALS_PATH }

    async getItems(_: string | null | undefined, __?: boolean) {
        return {
            path: EXTERNALS_PATH,
            items: ([{ name: "..", type: ItemType.Parent, isDirectory: true, isNotSelectable: true }] as Item[])
                .concat(this.items)
                .concat({ name: "Hinzufügen...", type: ItemType.Add, isDirectory: false, isNotSelectable: true })
        }
    }

    getColumns() {
        const widthstr = localStorage.getItem(`${this.folderId}-externals-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns: Column<FolderItem>[] = [{
            name: "Name",
            render: (td, item) => {
                const selector = (item as Item).type == ItemType.Parent
                    ? '#parentIcon'
                    : (item as Item).type == ItemType.Add
                        ? '#newIcon'
                        // : item.type == "android" 
                        // ? '#androidIcon'
                        : '#remoteIcon'
                var t = document.querySelector(selector) as HTMLTemplateElement
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "IP-Adresse",
            render: (td, item) => td.innerHTML = (item as Item).ip || ""
        }]
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    getItemPath(item: FolderItem) { return item.name }

    async getPath(item: FolderItem, refresh: () => void) {
        const extenalItem = item as Item
        if (extenalItem.type == ItemType.Parent)
            return { path: ROOT_PATH }
        else if (extenalItem.type == ItemType.Add) {
            const adderName = document.getElementById("adder-name") as HTMLInputElement
            adderName.value = ""
            const adderIp = document.getElementById("adder-ip") as HTMLInputElement
            adderIp.value = ""
            const res = await dialog.show({
                text: "Remote-Verbindung anlegen",
                extended: "external-adder",
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })
            if (res.result == Result.Ok) {
                const name = adderName.value
                const ip = adderIp.value
                this.items = this.items.concat([{name, ip, isDirectory: false}])
                this.saveItems()
                refresh()
            }
            return {}
        } else
            return { path: `external/${extenalItem.ip}` }
    }

    renderRow(item: FolderItem, tr: HTMLTableRowElement) {
        tr.ondragstart = null
        tr.ondrag = null
        tr.ondragend = null
    }

    saveWidths(widths: number[]) {
        localStorage.setItem(`${this.folderId}-externals-widths`, JSON.stringify(widths))
    }

    getSortFunction(column: number, isSubItem: boolean) { return null }

    disableSorting(table: VirtualTable<FolderItem>, disable: boolean) { }

    async renameItem(item: FolderItem, folder: Folder) {
        try {
            if ((item as Item).type && (item as Item).type != ItemType.Item)
                return
            
            const res = await dialog.show({
                text: "Eintrag umbenennen",
                inputText: item.name,
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })    
            folder.setFocus()
            if (res.result == Result.Ok && res.input) {
                item.name = res.input
                folder.reloadItems(true)
                this.saveItems()            
            }
        } catch (e: any) {}
    }

    async deleteItems(items: FolderItem[], folder: Folder) {
        try {
            const itemsToDelete = items.filter(n => !(n as Item).type || (n as Item).type == ItemType.Item)
            if (itemsToDelete.length == 0)
                return
            
            const res = await dialog.show({
                text: "Einträge löschen",
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })    
            folder.setFocus()
            if (res.result == Result.Ok) {
                this.items = this.items.filter(n => !itemsToDelete.includes(n))
                this.saveItems()
                folder.reloadItems(true)
            }
        } catch (e: any) {}
    }

    async addExtendedInfos(path: string | undefined | null, items: FolderItem[], refresh: () => void) { }
    async createFolder(suggestedName: string, folder: Folder) {}

    private saveItems() {
        localStorage.setItem("externals", JSON.stringify(this.items.map(n => {
            n.isSelected = false
            return n
        })))
    }
    
    private items = JSON.parse(localStorage.getItem("externals") || "[]") as Item[]
}