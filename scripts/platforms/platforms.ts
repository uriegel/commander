import { Column, VirtualTable } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { FolderItem } from '../engines/engines'
import { FileItem } from '../engines/file'
import { RootItem } from '../engines/root'
import { LinuxPlatform } from "./linux/platform"
import { WindowsPlatform } from "./windows/platform"

export const isLinux = process.platform == "linux"

export interface Platform {
    readonly pathDelimiter: string
    adaptWindow: (dialog: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem)=>void
    hideMenu: (hide: boolean)=>Promise<void>
    onDarkTheme: (dark: boolean)=>void
    getDrives: ()=>Promise<RootItem[]>
    adaptRootColumns: (columns: Column[])=>Column[]
    adaptDirectoryColumns: (columns: Column[])=>Column[]
    getRootPath: (item: RootItem)=>Promise<string>
    isFileEnginePath: (path: string|null|undefined)=>boolean
    parentIsRoot: (path: string)=>boolean
    disableSorting: (table: VirtualTable, disable: boolean)=>void
    addAdditionalInfo: (item: FileItem, name: string, path: string)=>Promise<void>
    getAdditionalSortFunction: (column: number, isSubItem: boolean)=>(([a, b]: FolderItem[]) => number) | null 
}

export const Platform = isLinux ? new LinuxPlatform() as Platform : new WindowsPlatform() as Platform
