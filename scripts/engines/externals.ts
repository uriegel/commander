import { VirtualTable } from "virtual-table-component";
import { dialog } from "../commander";
import { Engine, FolderItem } from "./engines";
import { ROOT_PATH } from "./root";

export const EXTERNALS_PATH = "externals"

enum ItemType {
    Parent,
    Item,
    Add
}

interface Item extends FolderItem {
    type: ItemType
    ip: string
}

export class ExternalsEngine implements Engine {
    constructor(private folderId: string) {}

    get currentPath() { return EXTERNALS_PATH }

    isSuitable(path: string|null|undefined) { return path == EXTERNALS_PATH }

    async getItems(_: string|null|undefined, __?: boolean) {
        return {
            path: EXTERNALS_PATH,
            items: [{ name: "..", type: ItemType.Parent, isDirectory: true } ]
                    .concat(this.items)
                    .concat({ name: "Hinzufügen...", type: ItemType.Add, isDirectory: false} )
        }    
    }

    getColumns() { 
        const widthstr = localStorage.getItem(`${this.folderId}-externals-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = [{
            name: "Name",
            render: (td: HTMLTableCellElement, item: Item) => {
                const selector = item.type == ItemType.Parent
                    ? '#parentIcon' 
                    : item.type == ItemType.Add
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
            render: (td: HTMLTableCellElement, item: Item) => td.innerHTML = item.ip || ""
        }]
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    getItemPath(item: FolderItem) { return item.name }

    async getPath(item: FolderItem, refresh: ()=>void) { 
        const extenalItem = item as Item
        if (extenalItem.type == ItemType.Parent)
            return { path: ROOT_PATH }
        else if (extenalItem.type == ItemType.Add) {
            const adderName = document.getElementById("adder-name") as HTMLInputElement
            adderName.value = ""
            const adderIp = document.getElementById("adder-ip") as HTMLInputElement
            adderIp.value = ""
            //const res = 
            await dialog.show({
                text: "Remote-Verbindung anlegen",
                extended: "external-adder",
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })    
            // if (res.result == RESULT_OK) {
            //     const name = adderName.value
            //     const ip = adderIp.value
            //     items = items.concat([{name, ip}])
            //     localStorage.setItem("externals", JSON.stringify(items))
            //     refresh()
            // }
            return {}
        } else
            return { path: `external/${extenalItem.ip}`}
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

    disableSorting(table: VirtualTable, disable: boolean) {}

    async addExtendedInfos(path: string|undefined|null, items: FolderItem[], refresh: ()=>void) {}
    
    private items = JSON.parse(localStorage.getItem("externals") || "[]") as Item[]
}