import 'virtual-table-component'
import { VirtualTable, TableItem } from 'virtual-table-component'

export class CopyProgress extends HTMLElement {
    constructor() {
        super()
        //const additionalStyle = `
        this.innerHTML = `
            <div class='copy-progress-root' tabIndex=1>
                <virtual-table></virtual-table>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]! as VirtualTable<TableItem>

        const columns = [{
            name: "Name",
            isSortable: true,
            render: (td: HTMLTableCellElement, item: TableItem) => {
                var element = document.createElement("HTMLDivElement")
                element.innerText = "item."
                td.appendChild(element)
            }
        }]
        this.table.setColumns(columns)
        this.table.setItems([{}, {}])
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


    private table: VirtualTable<TableItem>
}

customElements.define('copy-progress', CopyProgress)
