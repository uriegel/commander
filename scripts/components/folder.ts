import 'virtual-table-component'
import { VirtualTable } from 'virtual-table-component'
import { Engine, getEngine } from '../engines/engines'
import { NullEngine } from '../engines/nullengine'

export class Folder extends HTMLElement {
    constructor() {
        super()
        this.folderId = this.getAttribute("id")!

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
        this.pathInput = this.getElementsByTagName("INPUT")[0]! as HTMLInputElement

        this.table.renderRow = (item, tr) => {
            // tr.ondragstart = evt => this.onDragStart(evt)
            // tr.ondrag = evt => this.onDrag(evt)
            // tr.ondragend = evt => this.onDragEnd(evt)
            // tr.onmousedown = evt => {
            //     if (evt.ctrlKey) {
            //         setTimeout(() => {
            //             const pos = this.table.getPosition()
            //             this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
            //             this.computeExtendedNewNames()
            //             this.table.refresh()
            //         })
            //     }
            // }
            //this.processor.renderRow(item, tr)
        }

        this.table.addEventListener("currentIndexChanged", evt => this.sendStatusInfo((evt as CustomEvent).detail))
        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })
        this.table.addEventListener("keydown", evt => {
            switch (evt.which) {
                case 8: // backspace
                    //this.getHistoryPath(evt.shiftKey)
                    return
                case 9: // tab
                    if (evt.shiftKey) {
                        this.pathInput!.focus()
                    } else 
                        this.dispatchEvent(new CustomEvent('tab', { detail: this.id }))
                    evt.preventDefault()
                    evt.stopPropagation()
                    break
                case 27: // Escape
                    //this.selectNone()
                    break
                case 35: // end
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = !item.isNotSelectable && i >= pos)                     
                      //  this.computeExtendedNewNames()
                        this.table.refresh()
                    }
                    break
                case 36: // home
                    if (evt.shiftKey) {
                        const pos = this.table.getPosition()
                        this.table.items.forEach((item, i) => item.isSelected = !item.isNotSelectable && i <= pos)                     
                        //this.computeExtendedNewNames()
                        this.table.refresh()
                    }
                    break
                case 45: { // Ins
                    const pos = this.table.getPosition()
                    this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
                    //this.computeExtendedNewNames()
                    this.table.setPosition(pos + 1)
                    break
                }
            }
        })
        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    async changePath(path?: string|null, fromBacklog?: boolean) {
        const result = getEngine(this.folderId, path, this.engine)
        const req = ++this.latestRequest
        const itemsResult = (await result.engine.getItems(path, this.showHiddenItems))
        path = itemsResult.path
        let items = itemsResult.items
        if (!items || req < this.latestRequest) 
            return

        this.table.setItems([])
        if (result.changed || this.columnsChangeRequest) {
            this.columnsChangeRequest = false
            this.engine = result.engine
            const columns = this.engine.getColumns() // TODO this.isExtendedRename)
            this.table.setColumns(columns)
            //this.sortFunction = null
        }

        // this.processor.disableSorting(this.table, true)

        const dirs = items.filter(n => n.isDirectory)
        const files = items.filter(n => !n.isDirectory)
        this.dirsCount = dirs.length
        this.filesCount = files.length

        // if (this.sortFunction) 
        //     items = dirs.concat(files.sort(this.sortFunction))

        this.table.setItems(items)
        // this.table.setRestriction((items, restrictValue) => 
        //     items.filter(n => n.name.toLowerCase()
        //         .startsWith(restrictValue.toLowerCase())
        // ))
        
        this.onPathChanged(path, fromBacklog)
        // setTimeout(async () => {
        //     await this.processor.addExtendedInfos(path, this.table.items, () => this.table.refresh())
        //     this.processor.disableSorting(this.table, false)
        // })
    }

    setFocus() { this.table.setFocus() }

    private onPathChanged(newPath: string, fromBacklog?: boolean) {
        const path = newPath || this.engine.currentPath
        this.pathInput!.value = path
        localStorage.setItem(`${this.folderId}-lastPath`, path)
        if (!fromBacklog) {
            this.backPosition++
            this.backtrack.length = this.backPosition
            if (this.backPosition == 0 || this.backtrack[this.backPosition - 1] != path)
                this.backtrack.push(path)
        }
    }

    private sendStatusInfo(index: number) {
        if (this.table.items && this.table.items.length > 0)
            this.dispatchEvent(new CustomEvent('pathChanged', { detail: {
                path: this.engine.getItemPath(this.table.items[index]),
                dirs: this.dirsCount,
                files: this.filesCount
            }
        }))
    }



    private table: VirtualTable
    //private folderRoot: HTMLElement
    private folderId = ""
    private engine: Engine = new NullEngine()
    private latestRequest = 0
    private showHiddenItems = false
    private columnsChangeRequest = false
    private backtrack: string[] = []
    private backPosition = -1
    private pathInput: HTMLInputElement | null = null
    private dirsCount = 0
    private filesCount = 0

    // TODO: in another engine
    //private isExtendedRename = false
    // TODO: into engine
    //private sortFunction = null
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