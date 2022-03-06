import { DialogBox, Result } from "web-dialog-box"
import { Menubar, MenuItem } from "web-menu-bar"
import { request, ShowDevTools, ShowFullscreen } from "./requests"
export function initializeMenu() {}

const menu = document.getElementById("menu")! as Menubar
const itemHideMenu = document.getElementById("onHideMenu") as MenuItem
const dialog = document.querySelector('dialog-box') as DialogBox

const automode = localStorage.getItem("menuAutoMode") == "true"
console.log("automode", automode)
if (automode)
    menu.setAttribute("automode", "true")
itemHideMenu.isChecked = automode

document.getElementById("onClose")?.addEventListener("menubar-action", () => close())
itemHideMenu.addEventListener("menubar-checkbox", (evt: Event) => hideMenu((evt as CustomEvent).detail.isChecked))
document.getElementById("onDevTools")?.addEventListener("menubar-action", () => request(ShowDevTools))
document.getElementById("onFullscreen")?.addEventListener("menubar-action", () => request(ShowFullscreen))

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
