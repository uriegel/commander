const fspath = window.require('path')
const { getFileVersion } = window.require('rust-addon')
export const getDrives = window.require('rust-addon').getDrives
import { EXTERNALS_TYPE } from "../processors/externals"
import { compareVersion } from "../processors/rendertools.js"
import { EXTERN } from "../processors/root.js"
import { onFinish } from "../processors/copyProcessor.js"

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

export const createFolder = async newFolder => runCmd({
    method: "createFolder", 
    path: newFolder
})

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

export const onEnter = () => {}

const fillVersion = version => version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
