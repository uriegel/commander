import { Column } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { FolderItem } from '../../engines/engines'
import { FileItem } from '../../engines/file'
import { RootItem } from '../../engines/root'
import { activateClass } from '../../utils'
import { Platform } from "../platforms"

type Version = {
    major: number 
    minor: number
    build: number
    patch: number
}

interface WindowsFileItem extends FileItem {
    version: Version
}

export class WindowsPlatform implements Platform {

    readonly pathDelimiter = '\\'

    adaptWindow(_: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem) {
        itemHideMenu.isHidden = true
    }

    async hideMenu(_: boolean) {}

    onDarkTheme(dark: boolean) {
        activateClass(document.body, "windows-dark", dark) 
        activateClass(document.body, "windows", !dark) 
    }

    async getDrives() {
        return []
    }

    adaptRootColumns(columns: Column[]) { return columns}

    adaptDirectoryColumns(columns: Column[]) { 
        return [
            ...columns.slice(0, columns.length), {
                name: "Version",
                isSortable: true,
                render: (td: HTMLTableCellElement, item: FolderItem) => td.innerHTML = fillVersion((item as WindowsFileItem).version)
            }
        ]
    }

    async getRootPath(item: RootItem) { return item.name }

    isFileEnginePath(path: string|null|undefined) {
        return !!path && path[0] == ':'
    }    

    parentIsRoot(path: string) {
        return path.length == 3 && path[1] == ':'
    }
}

function fillVersion(version: Version) {
    return version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
}