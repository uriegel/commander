const fspath = window.require('path')
const getExifDate = window.require('filesystem-utilities').getExifDate
const getFileVersion = window.require('filesystem-utilities').getFileVersion
const trash = window.require('filesystem-utilities').trash
const copy = window.require('filesystem-utilities').copy

export const initializeCopying = onFinishCallback => onFinish = onFinishCallback


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
        render: (td, item) => {
            if (item.version)
                td.innerHTML = `${item.version.major}.${item.version.minor}.${item.version.patch}.${item.version.build}`
        }
    }
]

export const adaptConflictColumns = columns => [
    ...columns.slice(0, columns.length), {
        name: "Version",
        isSortable: true,
        render: (td, item) => {
            const template = document.getElementById('conflictItem')
            const element = template.content.cloneNode(true)
            const source = element.querySelector("div:first-child")
            if (item.source.version)
                source.innerHTML = `${item.source.version.major}.${item.source.version.minor}.${item.source.version.patch}.${item.source.version.build}`
            const target = element.querySelector("div:last-child")
            if (item.target.version)
                target.innerHTML = `${item.target.version.major}.${item.target.version.minor}.${item.target.version.patch}.${item.target.version.build}`
            // TODO compare
            // if (item.target.time.getTime() == item.source.time.getTime())
            //     td.classList.add("equal")
            // else if (item.source.time.getTime() > item.target.time.getTime())
            //     source.classList.add("overwrite")
            // else 
            //     target.classList.add("not-overwrite")
            td.appendChild(element)

            
            if (item.version)
                td.innerHTML = `${item.version.major}.${item.version.minor}.${item.version.patch}.${item.version.build}`
        }
    }
]

export const getRootPath = item => [ item.name, null ]

export const pathDelimiter = "\\"

export const parentIsRoot = currentPath => currentPath.length == 3 && currentPath[1] == ':'

export const adaptDisableSorting = (table, disable) => table.disableSorting(3, disable)

export async function addExtendedInfo(item, path) {
    var name = item.name.toLocaleLowerCase();
    if (name.endsWith(".exe") || name.endsWith(".dll"))
        item.version = await getFileVersion(fspath.join(path, item.name))
    else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
        item.exifTime = await getExifDate(fspath.join(path, item.name))
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

var onFinish