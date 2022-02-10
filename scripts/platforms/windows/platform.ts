import { Column, VirtualTable } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { FolderItem } from '../../engines/engines'
import { FileItem } from '../../engines/file'
import { RootItem } from '../../engines/root'
import { activateClass } from '../../utils'
import { Platform } from "../platforms"
const fspath = window.require('path')
const { getFileVersion } = window.require('rust-addon')

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
                sortIndex: 4,
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

    disableSorting(table: VirtualTable, disable: boolean) {
        table.disableSorting(3, disable)
    }

    async addAdditionalInfo(item: FileItem, name: string, path: string) { 
        if (name.endsWith(".exe") || name.endsWith(".dll"))
            (item as WindowsFileItem).version = await getFileVersion(fspath.join(path, item.name))
    }

    getAdditionalSortFunction(column: number, _: boolean): (([a, b]: FolderItem[]) => number) | null { 
        return column == 4 
            ? ([a, b]: FolderItem[]) => compareVersion((a as WindowsFileItem).version, (b as WindowsFileItem).version)
            : null
    }
}

function fillVersion(version: Version) {
    return version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
}

function compareVersion(versionLeft: Version, versionRight: Version) {
    return !versionLeft
        ? -1
        : !versionRight
        ? 1
        : versionLeft.major != versionRight.major 
        ? versionLeft.major - versionRight.major
        : versionLeft.minor != versionRight.minor
        ? versionLeft.minor - versionRight.minor
        : versionLeft.patch != versionRight.patch
        ? versionLeft.patch - versionRight.patch
        : versionLeft.build - versionRight.build
}
