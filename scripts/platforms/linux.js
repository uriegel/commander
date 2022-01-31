import { RESULT_CANCEL } from "web-dialog-box"

export function adaptWindow(dialogToSet, activeFolderSetFocusToSet, menuToSet, itemHideMenuToSet) {
    menu = menuToSet
    itemHideMenu = itemHideMenuToSet
    dialog = dialogToSet
    activeFolderSetFocus = activeFolderSetFocusToSet

    const titlebar = document.getElementById("titlebar")
    titlebar.setAttribute("no-titlebar", "")

    const automode = localStorage.getItem("menuAutoMode", false)
    menu.setAttribute("automode", automode)
    itemHideMenu.isChecked = automode == "true"
}

export async function hideMenu(hide) {
    if (hide) {
        const res = await dialog.show({
            text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        activeFolderSetFocus()
        if (res.result == RESULT_CANCEL) {
            itemHideMenu.isChecked = false
            return
        }
    }

    localStorage.setItem("menuAutoMode", hide)
    menu.setAttribute("automode", hide)
}

export function onDarkTheme(dark) {
    activateClass(document.body, "adwaita-dark", dark) 
    activateClass(document.body, "adwaita", !dark) 
}

var itemHideMenu
var menu
var dialog
var activeFolderSetFocus
