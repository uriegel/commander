import 'virtual-table-component'

class CopyConflicts extends HTMLElement {
    constructor() {
        super()
        const additionalStyle = ".exif {color: var(--exif-color);} }"
        this.innerHTML = `
            <div class=copy-conflicts-root>
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
                const img = document.createElement("img")
                const ext = getExtension(item.source.file)
                if (ext) {
                    // if (ext == "exe") {
                    //    img.src = `icon://${}`
                    // } else 
                    img.src = `icon://${ext}`
                    img.classList.add("image")
                    td.appendChild(img)
                } else {
                    var t = document.querySelector('#fileIcon')
                    td.appendChild(document.importNode(t.content, true))
                }
                const span = document.createElement('span')
                span.innerHTML = item.source.file
                td.appendChild(span)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            render: (td, item) => {
                td.innerHTML = formatDateTime(item.source.exifTime || item.source.time)
                if (item.source.exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.source.size)
                td.classList.add("rightAligned")
            }
        }]
        this.table.setColumns(columns)
    }
}

customElements.define('copy-conflicts', CopyConflicts)

