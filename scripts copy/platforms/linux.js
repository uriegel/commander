import { RESULT_CANCEL } from "web-dialog-box"
import { EXTERN } from "../processors/root.js"
import { copyProcessor } from "../processors/copyProcessor.js"
import { EXTERNALS_PATH } from "../processors/externals.js"
const { homedir } = window.require('os')
const { exec } = window.require("child_process")
const { trashFile } = window.require('rust-addon')
const { copyFile } = window.require('shared-module')
const FileResult = window.require('shared-module').FileResult

const homeDir = homedir()

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

export const adaptDirectoryColumns = columns => columns

export const adaptConflictColumns = columns => columns

export const getRootPath = async item => [item.mountPoint || (item.name == EXTERN ? EXTERNALS_PATH : ""), null]

export const adaptDisableSorting = () => { }

export async function addExtendedInfo() {}

export async function copyItems(copyInfo, move, overwrite, foldersToRefresh) {
    copyInfo.items.forEach(n => copyProcessor.addJob(n.file, n.targetFile, move, overwrite, foldersToRefresh))
}

export function deleteEmptyFolders(path, folders, foldersToRefresh) {
    copyProcessor.addDeleteEmptyFolders(path, folders, foldersToRefresh)
}

export const enhanceCopyConflictData = async item => item

export const onEnter = (fileName, path) => {
    const file = path + '/' + fileName
    try {
        fs.accessSync(file, fs.constants.X_OK)
        exec(file)
    } catch {
        exec(`xdg-open '${file}'`)
    }
    
}

var itemHideMenu
var menu
var dialog
var activeFolderSetFocus
