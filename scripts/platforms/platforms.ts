import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { LinuxPlatform } from "./linux/platform"
import { WindowsPlatform } from "./windows/platform"

export const isLinux = process.platform == "linux"

export interface Platform {
    adaptWindow: (dialog: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem)=>void
    hideMenu: (hide: boolean)=>Promise<void>
}

export function createPlatform() {
    return isLinux ? new LinuxPlatform() as Platform : new WindowsPlatform() as Platform
}