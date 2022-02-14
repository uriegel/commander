const fspath = window.require('path')
const { getFileVersion } = window.require('rust-addon')
export const getDrives = window.require('rust-addon').getDrives
import { EXTERNALS_TYPE } from "../processors/externals"
import { compareVersion } from "../processors/rendertools.js"
import { EXTERN } from "../processors/root.js"
import { onFinish } from "../processors/copyProcessor.js"

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

export async function deleteEmptyFolders(path, folders, foldersToRefresh) {
    await runCmd({
        method: "deleteEmptyFolders", 
        path,
        folders
    })
    onFinish(foldersToRefresh)
}

export const onEnter = () => {}

const fillVersion = version => version ? `${version.major}.${version.minor}.${version.build}.${version.patch}` : ""
