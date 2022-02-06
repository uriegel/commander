import { DialogBox, Result } from 'web-dialog-box'
import { Menubar, MenuItem } from 'web-menu-bar'
import { activateClass } from '../../utils'
import { Platform } from "../platforms"

export class LinuxPlatform implements Platform {
    adaptWindow(dialog: DialogBox, /* activeFolderSetFocusToSet, */ menu: Menubar, itemHideMenu: MenuItem) {
        this.dialog = dialog
        this.menu = menu
        this.itemHideMenu = itemHideMenu
        //activeFolderSetFocus = activeFolderSetFocusToSet
    
        const titlebar = document.getElementById("titlebar")!
        titlebar.setAttribute("no-titlebar", "")
    
        const automode = localStorage.getItem("menuAutoMode") == "true"
        if (automode)
            menu.setAttribute("automode", "true")
        itemHideMenu.isChecked = automode
    }

    async hideMenu(hide: boolean) {
        if (hide) {
            const res = await this.dialog!.show({
                text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })
            //     activeFolderSetFocus()
            if (res.result == Result.Cancel) {
                this.itemHideMenu!.isChecked = false
                return
            }
        }
    
        localStorage.setItem("menuAutoMode", hide ? "true" : "false")
        this.menu!.setAttribute("automode", hide ? "true" : "false")
    }

    onDarkTheme(dark: boolean) {
        activateClass(document.body, "adwaita-dark", dark) 
        activateClass(document.body, "adwaita", !dark) 
    }

    private dialog: DialogBox | null = null
    private itemHideMenu: MenuItem | null = null
    private menu: Menubar | null = null
}