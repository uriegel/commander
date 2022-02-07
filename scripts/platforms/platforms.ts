import { Column } from 'virtual-table-component'
import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { RootItem } from '../engines/root'
import { LinuxPlatform } from "./linux/platform"
import { WindowsPlatform } from "./windows/platform"

export const isLinux = process.platform == "linux"

export interface Platform {
    adaptWindow: (dialog: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem)=>void
    hideMenu: (hide: boolean)=>Promise<void>
    onDarkTheme: (dark: boolean)=>void
    getDrives: ()=>Promise<RootItem[]>
    adaptRootColumns: (columns: Column[])=>Column[]
}

export const Platform = isLinux ? new LinuxPlatform() as Platform : new WindowsPlatform() as Platform
