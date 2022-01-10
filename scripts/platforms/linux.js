import { RESULT_CANCEL } from "web-dialog-box"
import { ANDROID } from "../processors/root.js"
import { copyProcessor } from "../processors/copyProcessor.js"
const { homedir } = window.require('os')
const { exec } = window.require("child_process")
const { trash } = window.require('filesystem-utilities')
const { copyFile } = window.require('shared-module')

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

export async function getDrives() {
    const runCmd = cmd => new Promise(res => exec(cmd, (_, stdout) => res(stdout)))
    const drivesString = await runCmd('lsblk --bytes --output SIZE,NAME,LABEL,MOUNTPOINT,FSTYPE')
    const driveStrings = drivesString.split("\n")
    const columnsPositions = (() => {
        const title = driveStrings[0]
        const getPart = key => title.indexOf(key)

        return [
            0,
            getPart("NAME"),
            getPart("LABEL"),
            getPart("MOUNT"),
            getPart("FSTYPE")
        ]
    })()

    //const takeOr = (text: string, alt: string) => text ? text : alt
    const constructDrives = driveString => {
        const getString = (pos1, pos2) =>
            driveString.substring(columnsPositions[pos1], columnsPositions[pos2]).trim()
        const trimName = name =>
            name.length > 2 && name[1] == '─'
                ? name.substring(2)
                : name
        const mount = getString(3, 4)
     
        return {
            description: getString(2, 3),
            name: trimName(getString(1, 2)),
            type: 1, // TODO: Drive types enum DriveType
            mountPoint: mount,
            isMounted: !!mount,
            driveType: driveString.substring(columnsPositions[4]).trim(),
            size: parseInt(getString(0, 1), 10)
        }
    }

    const items = [{ name: "~", description: "home", mountPoint: homeDir, isMounted: true, type: 1, size: 0 }]
        .concat(driveStrings
            .slice(1)
            .filter(n => n[columnsPositions[1]] > '~')
            .map(constructDrives)
    )
    const mounted = items.filter(n => n.isMounted)
    const unmounted = items.filter(n => !n.isMounted)
    return mounted.concat(unmounted)
} 

export function onDarkTheme(dark) {
    activateClass(document.body, "adwaita-dark", dark) 
    activateClass(document.body, "adwaita", !dark) 
}

export function adaptRootColumns(columns) {
    return [
        ...columns.slice(0, 2), {
            name: "Mountpoint",
            render: (td, item) => td.innerHTML = item.mountPoint || ""
        },
        columns[2]
    ]
}

export const adaptDirectoryColumns = columns => columns

export const adaptConflictColumns = columns => columns

export const getRootPath = async item => [item.mountPoint || (item.name == ANDROID ? "android" : ""), null]

export const pathDelimiter = "/"

export const parentIsRoot = currentPath => currentPath == '/'

export const adaptDisableSorting = () => { }

export async function addExtendedInfo() {}

export async function deleteItems(items) {
    for (let i = 0; i < items.length; i++ ) {
        await trash(items[i])
    }
}    

export async function copyItems(copyInfo, move, overwrite, foldersToRefresh) {
    copyInfo.items.forEach(n => copyProcessor.addJob(n.file, n.targetFile, move, overwrite, foldersToRefresh))
}

export function deleteEmptyFolders(path, folders, foldersToRefresh) {
    copyProcessor.addDeleteEmptyFolders(path, folders, foldersToRefresh)
}

export async function renameItem(item, newName) {
    await copyFile(item, newName, () => {}, true)
}

export const enhanceCopyConflictData = async item => item

var itemHideMenu
var menu
var dialog
var activeFolderSetFocus
