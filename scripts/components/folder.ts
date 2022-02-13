import 'virtual-table-component'
import { TableItem, VirtualTable } from 'virtual-table-component'
import { getCopyEngine } from '../copy/copy'
import { Engine, getEngine } from '../engines/engines'
import { NullEngine } from '../engines/nullengine'
import { compose } from '../utils'

export interface FolderItem extends TableItem{
    name: string
    isDirectory: boolean
    isNotSelectable?: boolean
}

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
        
        this.table = this.getElementsByTagName("VIRTUAL-TABLE")[0]! as VirtualTable<FolderItem>
        const sbr = this.getAttribute("scrollbar-right")
        if (sbr)
            this.table.setAttribute("scrollbar-right", sbr)
        this.pathInput = this.getElementsByTagName("INPUT")[0]! as HTMLInputElement

        this.table.renderRow = (item, tr) => {
            // tr.ondragstart = evt => this.onDragStart(evt)
            // tr.ondrag = evt => this.onDrag(evt)
            // tr.ondragend = evt => this.onDragEnd(evt)
            tr.onmousedown = evt => {
                if (evt.ctrlKey) {
                    setTimeout(() => {
                        const pos = this.table.getPosition()
                        this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
                        //this.computeExtendedNewNames()
                        this.table.refresh()
                    })
                }
            }
            this.engine.renderRow(item, tr)
        }

        this.changePath() 
        const lastPath = localStorage.getItem(`${this.folderId}-lastPath`)
        setTimeout(() => this.changePath(lastPath))
    }

    connectedCallback() {
        this.table.addEventListener("columnclick", evt => {
            const detail = (evt as CustomEvent).detail
            const sortfn = this.engine.getSortFunction(detail.column, detail.subItem)
            if (!sortfn)
                return
            const ascDesc = (sortResult: number) => detail.descending ? -sortResult : sortResult
            this.sortFunction = compose(ascDesc, sortfn) 
            this.table.restrictClose()
            const dirs = (this.table.items as FolderItem[]).filter(n => n.isDirectory)
            const files = (this.table.items as FolderItem[]).filter(n => !n.isDirectory) 
            const pos = this.table.getPosition()
            const item = this.table.items[pos]
            this.table.items = dirs.concat(files.sort((a, b) => this.sortFunction!([a, b])))
            const newPos = this.table.items.findIndex(n => n.name == item.name)
            this.table.setPosition(newPos)
            //this.computeExtendedNewNames()
            this.table.refresh()
        })
        this.table.addEventListener("columnwidths", evt => this.engine.saveWidths((evt as CustomEvent).detail))
        this.table.addEventListener("currentIndexChanged", evt => this.sendStatusInfo((evt as CustomEvent).detail))
        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })
        this.table.addEventListener("delete", async evt => {
            const selectedItems = this.getSelectedItems()
            if (selectedItems.length > 0)
                this.deleteSelectedItems()
        })
        this.table.addEventListener("keydown", evt => {
            switch (evt.which) {
                case 8: // backspace
                    this.getHistoryPath(evt.shiftKey)
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
                    this.selectNone()
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
        this.table.addEventListener("enter", async evt => {
            const { path, recentFolder } = await this.engine.getPath(this.table.items[(evt as CustomEvent).detail.currentItem], () => this.reloadItems())
            if (path) {
                await this.changePath(path)
                if (recentFolder) {
                    const index = this.table.items.findIndex(n => n.name == recentFolder)
                    this.table.setPosition(index)
                }
            } else {
//                this.processor.onEnter(this.table.items[evt.detail.currentItem].name)
                this.setFocus()
            }
        })

        this.table.addEventListener("focusin", async evt => {
            this.dispatchEvent(new CustomEvent('onFocus', { detail: this.id }))
            this.sendStatusInfo(this.table.getPosition())
        })

        this.pathInput!.onkeydown = evt => {
            if (evt.which == 13) {
                this.changePath(this.pathInput!.value)
                this.table.setFocus()
            }
        }
        this.pathInput!.onfocus = () => setTimeout(() => this.pathInput!.select())
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
            this.sortFunction = null
        }

        this.engine.disableSorting(this.table, true)

        const dirs = items.filter(n => n.isDirectory)
        const files = items.filter(n => !n.isDirectory)
        this.dirsCount = dirs.length
        this.filesCount = files.length

        if (this.sortFunction) 
            items = dirs.concat(files.sort((a, b) => this.sortFunction!([a, b])))

        this.table.setItems(items)
        this.table.setRestriction((items, restrictValue) => 
            items.filter(n => n.name.toLowerCase()
                .startsWith(restrictValue.toLowerCase())
        ))
        
        this.onPathChanged(path, fromBacklog)
        setTimeout(async () => {
            await this.engine.addExtendedInfos(path, this.table.items, () => this.table.refresh())
            this.engine.disableSorting(this.table, false)
        })
    }

    setFocus() { this.table.setFocus() }

    getCurrentPath() {
        return this.engine.currentPath
    }

    getSelectedItems(): FolderItem[] {
        const selectedItems = this.table.items
            .filter(n => n.isSelected) 
        if (selectedItems.length == 0 && this.table.getPosition() == 0 && this.table.items[0].name == "..")
            return []
        return selectedItems.length > 0
            ? selectedItems
            : [this.table.items[this.table.getPosition()]]
    }

    showHidden(hidden: boolean) {
        this.showHiddenItems = hidden
        this.reloadItems()
    }

    async reloadItems(keepSelection?: boolean) {
        const pos = keepSelection == true ? this.table.getPosition() : 0
        this.table.items[pos].isSelected = !this.table.items[pos].isNotSelectable && !this.table.items[pos].isSelected 
        await this.changePath(this.engine.currentPath)
        if (pos)
            this.table.setPosition(pos)
    }

    selectAll() {
        this.table.items.forEach(n => n.isSelected = !n.isNotSelectable)
//        this.computeExtendedNewNames()
        this.table.refresh()
    }

    selectNone() {
        this.table.items.forEach(n => n.isSelected = false)
//        this.computeExtendedNewNames()
        this.table.refresh()
    }

    renameItem() {
        const selectedItems = this.getSelectedItems()
            if (selectedItems.length != 1)    
                return        
        this.engine.renameItem(selectedItems[0], this)
    }

    deleteSelectedItems() {
        const selectedItems = this.getSelectedItems()
        if (selectedItems.length == 0)    
            return        
        this.engine.deleteItems(selectedItems, this)
    }

    createFolder() {
        const selectedItems = this.getSelectedItems()
        this.engine.createFolder(selectedItems.length == 1 ? selectedItems[0].name : "", this)
    }

    async copy(other: Folder, move?: boolean) {
        const selectedItems = this.getSelectedItems()
        if (selectedItems.length == 0)
            return
        const copy = getCopyEngine(this.engine, other.engine, move)
        if (copy && await copy.process(selectedItems)) {
            this.reloadItems(move != true)
            if (move == true)
                other.reloadItems()
        }
    }

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

    private getHistoryPath(forward?: boolean) {
        if (!forward && this.backPosition >= 0) {
            this.backPosition--
            this.changePath(this.backtrack[this.backPosition], true)
        } else if (forward && this.backPosition < this.backtrack.length - 1) {
            this.backPosition++
            this.changePath(this.backtrack[this.backPosition], true)
        }
    }

    private table: VirtualTable<FolderItem>
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
    private sortFunction: ((row: [a: FolderItem, b: FolderItem]) => number) | null = null


    // TODO: in another engine
    //private isExtendedRename = false
}

customElements.define('folder-table', Folder)

// TODO Processor: CanAction can copy can move... fromProcessor toProcessor
// TODO Copy/Move with Drag'n'Drop
// TODO Copy conflicts: order by red, then green, then equal

// TODO Shellexecute on Windows

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