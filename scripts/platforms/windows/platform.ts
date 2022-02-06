import { DialogBox } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { Platform } from "../platforms"

export class WindowsPlatform implements Platform {
    adaptWindow(_: DialogBox, /*activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem) {
        itemHideMenu.isHidden = true
    }
    async hideMenu(_: boolean) {}
}