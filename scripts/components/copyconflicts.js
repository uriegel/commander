import 'virtual-table-component'
import { formatDateTime, formatSize, getExtension } from "../processors/rendertools.js"
import { pathDelimiter } from "../platforms/switcher.js"

class CopyConflicts extends HTMLElement {
    constructor() {
        super()
        const additionalStyle = `
        .exif {
            color: var(--exif-color);
        }
        .conflictItem {
            text-overflow: ellipsis;
            overflow: hidden;
        }`
        this.innerHTML = `
            <div class='copy-conflicts-root' tabIndex=1>
                <virtual-table additionalStyle='${additionalStyle}'></virtual-table>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]
        // const sbr = this.getAttribute("scrollbar-right")
        // if (sbr)
        //     this.table.setAttribute("scrollbar-right", sbr)
        
        //this.table.renderRow = (item, tr) => this.processor.renderRow(item, tr)

        //let columns = adaptDirectoryColumns([{
        let columns = [{
            name: "Name",
            isSortable: true,
            subItem: {
                name: "Ext.",
                isSortable: true
            },            
            render: (td, item) => {
                const ext = getExtension(item.source.file)
                // if (ext == "exe") {
                //    img.src = `icon://${}`
                // } else 
                const name = item.source.file.substr(item.source.file.lastIndexOf(pathDelimiter) + 1)

                const template = document.getElementById('conflictName')
                const element = template.content.cloneNode(true)
                const img = element.querySelector("img")
                img.src = `icon://${ext}`
                const text = element.querySelector("span")
                text.innerHTML = name
                td.appendChild(element)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            render: (td, item) => {
                const template = document.getElementById('conflictItem')
                const element = template.content.cloneNode(true)
                const source = element.querySelector("div:first-child")
                source.innerHTML = formatDateTime(item.source.time)
                const target = element.querySelector("div:last-child")
                target.innerHTML = formatDateTime(item.target.time)
                td.appendChild(element)
            }
        }, {
            name: "Größe",
            isSortable: true,
            isRightAligned: true,
            render: (td, item) => {
                const template = document.getElementById('conflictItem')
                const element = template.content.cloneNode(true)
                const source = element.querySelector("div:first-child")
                source.innerHTML = formatSize(item.source.size)
                const target = element.querySelector("div:last-child")
                target.innerHTML = formatSize(item.target.size)
                td.appendChild(element)
            }
        }]
        this.table.setColumns(columns)
    }

    createdCallback() {
        this.tabIndex = 0
    }

    focus() { 
        this.table.setFocus() 
        this.tabIndex = -1
    }

    blur() { 
        this.tabIndex = 0
    }
    
    setItems(items) {
        var observer = new IntersectionObserver((e, o)  => {
            o.unobserve(this.table)
            this.table.setItems(items)
        }, { root: document.documentElement })
        observer.observe(this.table)
    }
}

customElements.define('copy-conflicts', CopyConflicts)

// TODO Green items, red items
// TODO class if date or size is different 
