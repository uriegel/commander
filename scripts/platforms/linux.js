import { RESULT_CANCEL } from "web-dialog-box"
const fspath = window.require('path')
const { getExifDate, trash } = window.require('filesystem-utilities')

export { initializeCopying } from "./copyProcessor.js"

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

export async function copyItems(sourcePath, targetPath, items, move) {
    
    
    
    
    
    
    //await copy(sourcePath, targetPath, items)
}
    // }=> platformCopyItems(sourcePath,items.map(n => fspath.join(currentPath, n)))
//     id: getInactiveFolder().id,
//     sourcePath: activeFolder.getCurrentPath(),
//     destinationPath: path,
//     directories: itemsToCopy.filter(n => n.isDirectory).map(n => n.name),
//     files: itemsToCopy.filter(n => !n.isDirectory).map(n => n.name)

var itemHideMenu
var menu
var dialog
var activeFolderSetFocus