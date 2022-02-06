import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { activateClass } from '../../utils'
import { Platform } from "../platforms"

export class WindowsPlatform implements Platform {
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
}