import { Menubar, MenuItem } from 'web-menu-bar'
import { Platform } from "../platforms"

export class LinuxPlatform implements Platform {
    adaptWindow(/*dialogToSet: any, activeFolderSetFocusToSet, */ menu: Menubar, itemHideMenu: MenuItem) {
      //  this.menu = menu
        //itemHideMenu = itemHideMenuToSet
        //dialog = dialogToSet
        //activeFolderSetFocus = activeFolderSetFocusToSet
    
        const titlebar = document.getElementById("titlebar")!
        titlebar.setAttribute("no-titlebar", "")
    
        const automode = localStorage.getItem("menuAutoMode") == "true"
        if (automode)
            menu.setAttribute("automode", "true")
        //itemHideMenu.isChecked = automode == "true"
    }

    //private menu: Menubar | null = null
}