import 'virtual-table-component'
import { VirtualTable } from 'virtual-table-component'

export class Folder extends HTMLElement {
    constructor() {
        super()

        const additionalStyle = ".exif {color: var(--exif-color);} .isSelected .exif {color: var(--selected-exif-color); }"
        this.innerHTML = `
            <div class=folder>
                <input class=pathInput></input>
                <div class=folderroot>
                    <virtual-table additionalStyle='${additionalStyle}'></virtual-table>
                </div>
            </div`
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]! as VirtualTable
      //  this.folderRoot = this.getElementsByClassName("folderroot")[0]! as HTMLElement
        const sbr = this.getAttribute("scrollbar-right")
        if (sbr)
            this.table.setAttribute("scrollbar-right", sbr)
    }

    private table: VirtualTable
    //private folderRoot: HTMLElement
}

customElements.define('folder-table', Folder)

// TODO Processor: CanAction can copy can move... fromProcessor toProcessor
// TODO Copy/Move with Drag'n'Drop
// TODO Copy conflicts: order by red, then green, then equal

// TODO Shellexecute on Windows
// TODO Windows: sort version

// TODO Show trashinfo (show trash)
// TODO Undelete files
// TODO Empty trash
// TODO Copy with Copy Paste (from external or from internal)
// TODO ProgressControl: multiple progresses: show in ProgressBars in popovermenu, show latest in ProgressPie
// TODO Windows after copy: electron does not have focus. Old Commander is OK!!!!!!!

// TODO Status line (# files, # selected files), root
// TODO Status Linux: styling

// TODO retrieve copy conflicts only, if source folders and target folders are the same
// TODO Linux: copy to self

// TODO stack MessageBoxes