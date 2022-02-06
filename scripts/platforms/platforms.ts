import { Menubar, MenuItem } from 'web-menu-bar'
import { LinuxPlatform } from "./linux/platform"
import { WindowsPlatform } from "./windows/platform"

export const isLinux = process.platform == "linux"

export interface Platform {
    adaptWindow: (/*dialogToSet: any, activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem)=>void
}

export function createPlatform() {
    return isLinux ? new LinuxPlatform() as Platform : new WindowsPlatform() as Platform
}