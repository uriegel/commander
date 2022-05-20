import { DialogBox, Result } from "web-dialog-box"
import { Menubar, MenuItem } from "web-menu-bar"
import {
    activeFolderSetFocus, onAdaptPath, onCreateFolder, onDelete, onRefresh, onSelectAll,
    onSelectNone, onSetHidden, onViewer, onRename, onCopy, onMove
} from "./commander"
import { request } from "./requests"
export function initializeMenu() {}

const menu = document.getElementById("menu")! as Menubar
const itemHideMenu = document.getElementById("onHideMenu") as MenuItem
const dialog = document.querySelector('dialog-box') as DialogBox

const automode = localStorage.getItem("menuAutoMode") == "true"
if (automode)
    menu.setAttribute("automode", "true")
itemHideMenu.isChecked = automode

document.getElementById("onCopy")?.addEventListener("menubar-action",         () => onCopy())
document.getElementById("onMove")?.addEventListener("menubar-action",         () => onMove())
document.getElementById("onRename")?.addEventListener("menubar-action",       () => onRename())
document.getElementById("onCreateFolder")?.addEventListener("menubar-action", () => onCreateFolder())
document.getElementById("onDelete")?.addEventListener("menubar-action",       () => onDelete())
document.getElementById("onClose")?.addEventListener("menubar-action",        () => request("close"))
document.getElementById("onAdaptPath")?.addEventListener("menubar-action",    () => onAdaptPath())
document.getElementById("onSelectAll")?.addEventListener("menubar-action",    () => onSelectAll())
document.getElementById("onSelectNone")?.addEventListener("menubar-action",   () => onSelectNone())
itemHideMenu.addEventListener("menubar-checkbox",                             (evt: Event) => hideMenu((evt as CustomEvent).detail.isChecked))
document.getElementById("onHidden")?.addEventListener("menubar-checkbox",     (evt: Event) => onSetHidden((evt as CustomEvent).detail.isChecked))
document.getElementById("onRefresh")?.addEventListener("menubar-action",      () => onRefresh())
document.getElementById("onViewer")?.addEventListener("menubar-checkbox",     (evt: Event) => onViewer((evt as CustomEvent).detail.isChecked))
document.getElementById("onDevTools")?.addEventListener("menubar-action",     () => request("showdevtools"))
document.getElementById("onFullscreen")?.addEventListener("menubar-action",   () => request("showfullscreen"))

async function hideMenu(hide: boolean) {
    if (hide) {
        const res = await dialog!.show({
            text: "Soll das Menü verborgen werden? Aktivieren mit Alt-Taste",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        activeFolderSetFocus()
        if (res.result == Result.Cancel) {
            itemHideMenu!.isChecked = false
            return
        }
    }

    localStorage.setItem("menuAutoMode", hide ? "true" : "false")
    menu.setAttribute("automode", hide ? "true" : "false")
}

