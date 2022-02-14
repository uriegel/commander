import { Column, VirtualTable } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { CopyConflict, FileInfo } from '../components/copyconflicts'
import { FolderItem } from '../components/folder'
import { CopyItem } from '../copy/fileCopyEngine'
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
    adaptRootColumns: (columns: Column<FolderItem>[])=>Column<FolderItem>[]
    adaptDirectoryColumns: (columns: Column<FolderItem>[])=>Column<FolderItem>[]
    getRootPath: (item: RootItem)=>Promise<string>
    isFileEnginePath: (path: string|null|undefined)=>boolean
    parentIsRoot: (path: string)=>boolean
    disableSorting: (table: VirtualTable<FolderItem>, disable: boolean)=>void
    addAdditionalInfo: (item: FileItem, name: string, path: string)=>Promise<void>
    getAdditionalSortFunction: (column: number, isSubItem: boolean)=>(([a, b]: FolderItem[]) => number) | null 
    renameFile: (item: string, newName: string)=>Promise<void>
    deleteFiles: (items: string[])=>Promise<void>
    createFolder: (item: string)=>Promise<void>
    enhanceFileInfo: (item: FileInfo)=>Promise<FileInfo>
    copyItems: (copyInfo: CopyItem[], overwrite: boolean, move?: boolean)=>Promise<void>
    adaptConflictsColumns: (columns: Column<CopyConflict>[])=>Column<CopyConflict>[]
}

export const Platform = isLinux ? new LinuxPlatform() as Platform : new WindowsPlatform() as Platform
