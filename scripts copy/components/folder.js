const ipcRenderer = window.require('electron').ipcRenderer
const fspath = window.require('path')









class Folder extends HTMLElement {
   


    get extendedRename() { return this.isExtendedRename }
    set extendedRename(value) {
        this.isExtendedRename = value
        this.columnsChangeRequest = true
        this.reloadItems()
    }
    
    computeExtendedNewNames() {

        const formatNewName = (n, i) => { 
            const ext = getExtension(n.name)
            n.newName =
                `${this.isExtendedRename.prefix}${String(i + Number.parseInt(this.isExtendedRename.start)).padStart(Number.parseInt(this.isExtendedRename.digits), '0')}${ext}`
        }

        if (this.isExtendedRename) {
            this.table.items
                .filter(n => !n.isSelected)
                .forEach(n => n.newName = "")
            this.table.items
                .filter(n => n.isSelected)
                .forEach(formatNewName)
        }
    }
    
    doExtendedRename() {
        console.log("Extended renaming", this.table.items.filter(n => n.isSelected))
    }
}


