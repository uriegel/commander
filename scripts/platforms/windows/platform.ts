import { Menubar, MenuItem } from 'web-menu-bar'
import { Platform } from "../platforms"

export class WindowsPlatform implements Platform {
    adaptWindow(/*dialogToSet: any, activeFolderSetFocusToSet, */ menuToSet: Menubar, itemHideMenu: MenuItem) {
        itemHideMenu.isHidden = true
    }
}