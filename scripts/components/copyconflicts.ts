import 'virtual-table-component'
import { TableItem, VirtualTable } from 'virtual-table-component'
import { formatDateTime, formatSize, getExtension } from '../engines/engines'
import { Platform } from '../platforms/platforms'

export interface CopyConflict extends TableItem {
    source: FileInfo,
    target: FileInfo
}

export type FileInfo = {
    file: string,
    name?: string | undefined,
    size: number,
    time: Date
}

export class CopyConflicts extends HTMLElement {

    private table: VirtualTable<CopyConflict>

    constructor() {
        super()
        const additionalStyle = `
        .exif {
            color: var(--exif-color);
        }
        .conflictItem {
            text-overflow: ellipsis;
            overflow: hidden;
        }
        .equal {
            color: gray
        }
        .overwrite {
            color: black;
            background-color: lightgreen;
        }
        .not-overwrite {
            color: white;
            background-color: red;
        }`
        this.innerHTML = `
            <div class='copy-conflicts-root' tabIndex=1>
                <virtual-table additionalStyle='${additionalStyle}'></virtual-table>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0] as VirtualTable<CopyConflict>
        // const sbr = this.getAttribute("scrollbar-right")
        // if (sbr)
        //     this.table.setAttribute("scrollbar-right", sbr)
        
        //this.table.renderRow = (item, tr) => this.processor.renderRow(item, tr)

        const columns = Platform.adaptConflictsColumns([{
            name: "Name",
            isSortable: true,
            subItem: {
                name: "Ext."
            },            
            render: (td, item) => {
                const ext = getExtension(item.source.file)
                // if (ext == "exe") {
                //    img.src = `icon://${}`
                // } else 
                const name = item.source.name

                const template = document.getElementById('conflictName') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const img = element.querySelector("img") as HTMLImageElement
                img.src = `icon://${ext}`
                const text = element.querySelector("span") as HTMLSpanElement
                text.innerHTML = name ?? ""
                td.appendChild(element)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            render: (td, item) => {
                const template = document.getElementById('conflictItem') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const source = element.querySelector("div:first-child")!
                source.innerHTML = formatDateTime(item.source.time.getTime())
                const target = element.querySelector("div:last-child")!
                target.innerHTML = formatDateTime(item.target.time.getTime())
                if (item.target.time.getTime() == item.source.time.getTime())
                    td.classList.add("equal")
                else if (item.source.time.getTime() > item.target.time.getTime())
                    source.classList.add("overwrite")
                else 
                    target.classList.add("not-overwrite")
                td.appendChild(element)
            }
        }, {
            name: "Größe",
            isSortable: true,
            isRightAligned: true,
            render: (td, item) => {
                const template = document.getElementById('conflictItem') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const source = element.querySelector("div:first-child")!
                source.innerHTML = formatSize(item.source.size)
                const target = element.querySelector("div:last-child")!
                target.innerHTML = formatSize(item.target.size)
                if (item.target.size == item.source.size)
                    td.classList.add("equal")
                td.appendChild(element)
            }
        }])
        this.table.setColumns(columns)
    }

    createdCallback() {
        this.tabIndex = 0
    }

    override focus() { 
        this.table.setFocus() 
        this.tabIndex = -1
    }

    override blur() { 
        this.tabIndex = 0
    }
    
    setItems(items: CopyConflict[]) {
        this.table.setItems(items)
    }
}

customElements.define('copy-conflicts', CopyConflicts)

