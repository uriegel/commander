const fspath = window.require('path')
export const { getDrives } = window.require('filesystem-utilities')
const { getFileVersion } = window.require('filesystem-utilities')
import { ANDROID_PATH } from "../processors/androids.js"
import { compareVersion } from "../processors/rendertools.js"
import { ANDROID } from "../processors/root.js"
import { onFinish } from "../processors/copyProcessor.js"

export const adaptWindow = (menu, itemHideMenu) => itemHideMenu.isHidden = true

export function onDarkTheme(dark) {
    activateClass(document.body, "windows-dark", dark) 
    activateClass(document.body, "windows", !dark) 
}

export const adaptRootColumns = columns => columns

export const adaptDirectoryColumns = columns => [
    ...columns.slice(0, columns.length), {
        name: "Version",
        isSortable: true,
        render: (td, item) => td.innerHTML = fillVersion(item.version)
    }
]

export const adaptConflictColumns = columns => [
    ...columns.slice(0, columns.length), {
        name: "Version",
        isSortable: true,
        sortIndex: 4,
        render: (td, item) => {
            const template = document.getElementById('conflictItem')
            const element = template.content.cloneNode(true)
            const source = element.querySelector("div:first-child")
            source.innerHTML = fillVersion(item.source.version)
            const target = element.querySelector("div:last-child")
            target.innerHTML = fillVersion(item.target.version)

            var diff = compareVersion(item.source.version, item.target.version)
            if (diff == 0)
                td.classList.add("equal")
            else if (diff > 0)
                source.classList.add("overwrite")
            else 
                target.classList.add("not-overwrite")
            td.appendChild(element)
        }
    }
]

export const getRootPath = async item => [ item.name != ANDROID ? item.name : ANDROID_PATH, null ]

export const pathDelimiter = "\\"

export const parentIsRoot = currentPath => currentPath.length == 3 && currentPath[1] == ':'

export const adaptDisableSorting = (table, disable) => table.disableSorting(3, disable)

export async function addExtendedInfo(item, name, path) {
    if (name.endsWith(".exe") || name.endsWith(".dll"))
        item.version = await getFileVersion(fspath.join(path, item.name))
}

export async function deleteItems(items) {
    return runCmd({
        method: "trash", 
        items,
    })
}   

export async function copyItems(copyInfo, move, overwrite, foldersToRefresh) {
    await runCmd({
        method: "copy", 
        copyInfo,
        move: move || false,
        overwrite
    })
    onFinish(foldersToRefresh)
}

export async function renameItem(item, newName) {
    await runCmd({
        method: "rename", 
        item,
        newName
    })
}

export async function deleteEmptyFolders(path, folders, foldersToRefresh) {
    await runCmd({
        method: "deleteEmptyFolders", 
        path,
        folders
    })
    onFinish(foldersToRefresh)
}

export const enhanceCopyConflictData = async item => ({
    ...item,
    version: await getFileVersion(item.file)
})

const fillVersion = version => version ? `${version.major}.${version.minor}.${version.patch}.${version.build}` : ""
