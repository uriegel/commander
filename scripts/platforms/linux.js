import { RESULT_CANCEL } from "web-dialog-box"
import { createCopyProcessor } from "./copyProcessor.js"
const fspath = window.require('path')
const { getExifDate, trash, copy } = window.require('filesystem-utilities')

export function initializeCopying(onFinishCallback, onShowCopyErrors) {
    copyProcessor = createCopyProcessor(onFinishCallback, onShowCopyErrors)
}

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

export function adaptRootColumns(columns) {
    return [
        ...columns.slice(0, 2), {
            name: "Mountpoint",
            render: (td, item) => td.innerHTML = item.mountPoint
        },
        columns[2]
    ]
}

export const adaptDirectoryColumns = columns => columns

export const getRootPath = item => [item.mountPoint, null]

export const pathDelimiter = "/"

export const parentIsRoot = currentPath => currentPath == '/'

export const adaptDisableSorting = () => { }

export async function addExtendedInfo(item, path) {
    var name = item.name.toLocaleLowerCase();
    if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
        item.exifTime = await getExifDate(fspath.join(path, item.name))
}

export async function deleteItems(items) {
    for (let i = 0; i < items.length; i++ ) {
        await trash(items[i])
    }
}    

export async function copyItems(sourcePath, targetPath, items, move, foldersToRefresh) {
    items.forEach(n => copyProcessor.addJob(fspath.join(sourcePath, n), fspath.join(targetPath, n), move, foldersToRefresh))
}

export async function renameItem(item, newName) {
    await copy(item, newName, () => {}, true)
}

var itemHideMenu
var menu
var dialog
var activeFolderSetFocus
var copyProcessor