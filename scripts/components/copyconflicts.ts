import 'virtual-table-component'
import { VirtualTable } from 'virtual-table-component'
import { ConflictItem } from '../requests'
import { formatDateTime, formatSize, getExtension } from './folder'

export type FileInfo = {
    file: string,
    name?: string | undefined,
    size: number,
    time: Date
}

export class CopyConflicts extends HTMLElement {

    private table: VirtualTable<ConflictItem>

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
            color: gray;
        }
        .hidden {
            display: none;
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
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0] as VirtualTable<ConflictItem>
        // const sbr = this.getAttribute("scrollbar-right")
        // if (sbr)
        //     this.table.setAttribute("scrollbar-right", sbr)
        
        //this.table.renderRow = (item, tr) => this.processor.renderRow(item, tr)

        //const columns = Platform.adaptConflictsColumns([{
        const columns = [{        
            name: "Name",
            isSortable: true,
            subItem: {
                name: "Ext."
            },            
            render: (td: HTMLTableCellElement, item: ConflictItem) => {
                const ext = getExtension(item.conflict)
                // if (ext == "exe") {
                //    img.src = `icon://${}`
                // } else 
                const name = item.conflict

                const template = document.getElementById('conflictName') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const img = element.querySelector("img") as HTMLImageElement
                if (item.isDirectory) {
                    var dirIcon = document.querySelector('#folderIcon') as HTMLTemplateElement
                    td.appendChild(document.importNode(dirIcon.content, true))
                    img.classList.add("hidden")
                } else
                    img.src = `commander/geticon?path=${ext}`
                const text = element.querySelector("span") as HTMLSpanElement
                text.innerHTML = name ?? ""
                td.appendChild(element)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            render: (td: HTMLTableCellElement, item: ConflictItem) => {
                const template = document.getElementById('conflictItem') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const source = element.querySelector("div:first-child")!
                source.innerHTML = formatDateTime(item.sourceTime)
                const target = element.querySelector("div:last-child")!
                target.innerHTML = formatDateTime(item.targetTime)
                if (item.targetTime == item.sourceTime)
                    td.classList.add("equal")
                else if (item.sourceTime > item.targetTime)
                    source.classList.add("overwrite")
                else 
                    target.classList.add("not-overwrite")
                td.appendChild(element)
            }
        }, {
            name: "Größe",
            isSortable: true,
            isRightAligned: true,
            render: (td: HTMLTableCellElement, item: ConflictItem) => {
                const template = document.getElementById('conflictItem') as HTMLTemplateElement
                const element = template.content.cloneNode(true) as HTMLElement
                const source = element.querySelector("div:first-child")!
                source.innerHTML = formatSize(item.sourceSize)
                const target = element.querySelector("div:last-child")!
                target.innerHTML = formatSize(item.targetSize)
                if (item.targetSize == item.sourceSize)
                    td.classList.add("equal")
                td.appendChild(element)
            }
        }]
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
    
    setItems(items: ConflictItem[]) {
        this.table.setItems(items)
    }
}

customElements.define('copy-conflicts', CopyConflicts)

