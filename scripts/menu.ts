import { DialogBox, Result } from "web-dialog-box"
import { Menubar, MenuItem } from "web-menu-bar"
import { request, ShowDevTools, ShowFullscreen } from "./requests"
export function initializeMenu() {}

const menu = document.getElementById("menu")! as Menubar
const itemHideMenu = document.getElementById("hidemenu") as MenuItem
const dialog = document.querySelector('dialog-box') as DialogBox

const automode = localStorage.getItem("menuAutoMode") == "true"
if (automode)
    menu.setAttribute("automode", "true")
itemHideMenu.isChecked = automode

window.onClose = ()                      => close()
window.onHideMenu = (isChecked: boolean) => hideMenu(isChecked)
window.onDevTools = async ()             => await request(ShowDevTools)
window.onFullscreen = async ()           => await request(ShowFullscreen)

async function hideMenu(hide: boolean) {
    if (hide) {
        const res = await dialog!.show({
            text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        //     activeFolderSetFocus()
        if (res.result == Result.Cancel) {
            itemHideMenu!.isChecked = false
            return
        }
    }

    localStorage.setItem("menuAutoMode", hide ? "true" : "false")
    menu.setAttribute("automode", hide ? "true" : "false")
}
