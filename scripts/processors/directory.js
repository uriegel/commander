export const DIRECTORY_TYPE = "directory"
import { formatDateTime, formatSize, getExtension, compareVersion } from "./rendertools.js"
import { ROOT } from "./root.js"
import { FILE, DIRECTORY } from '../commander.js'
import {
    pathDelimiter,
    adaptDirectoryColumns,
    parentIsRoot,
    adaptDisableSorting,
    addExtendedInfo,
    deleteItems as platformDeleteItems,
    copyItems as platformCopyItems,
    renameItem as platformRenameItem,
    deleteEmptyFolders as platformDeleteEmptyFolders,
    enhanceCopyConflictData 
} from "../platforms/switcher.js"

const { getFiles } = window.require('filesystem-utilities')
const fspath = window.require('path')
const fs = window.require('fs')
const { readdir, stat } = window.require('fs/promises')

export const getDirectory = (folderId, path) => {
    const getType = () => DIRECTORY_TYPE
    
    let currentPath = ""

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = adaptDirectoryColumns([{
            name: "Name",
            isSortable: true,
            subItem: {
                name: "Ext.",
                isSortable: true
            },            
            render: (td, item) => {
                const selector = item.name == ".." 
                    ? '#parentIcon' 
                    : item.isDirectory
                        ? '#folderIcon'
                        : '#fileIcon'
                if (selector != '#fileIcon') {
                    var t = document.querySelector(selector)
                    td.appendChild(document.importNode(t.content, true))
                } else {
                    const img = document.createElement("img")
                    const ext = getExtension(item.name)
                    // TODO: Windows
                    //if (ext) {
                        // if (ext == "exe") {
                        //    img.src = `icon://${}`
                        // } else 
                        img.src = `icon://${ext}`
                        img.classList.add("image")
                        td.appendChild(img)
                    // } else {
                    //     var t = document.querySelector(selector)
                    //     td.appendChild(document.importNode(t.content, true))
                    // }
                }

                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }            
        }, {
            name: "Datum",
            isSortable: true,
            render: (td, item) => {
                td.innerHTML = formatDateTime(item.exifTime || item.time)
                if (item.exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.size)
                td.classList.add("rightAligned")
            }
        }])
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    const renderRow = (item, tr) => {
        tr.setAttribute("draggable", "true")
        if (item.isHidden)
            tr.style.opacity = 0.5
    }

    const getParentDir = path => {
        let pos = path.lastIndexOf(pathDelimiter)
        let parent = pos ? path.substr(0, pos) : pathDelimiter
        return [parent, path.substr(pos + 1)]
    }
    
    const getCurrentPath = () => currentPath

    const getPath = item => item.isDirectory 
        ? item.name != ".."
            ? [
                currentPath != "\\" ? currentPath + pathDelimiter + item.name : currentPath + item.name, 
                null]
            : parentIsRoot(currentPath)  
                ? [ROOT, null]
                : getParentDir(currentPath)
        : [null, null]

    const getItems = async (path, hiddenIncluded) => {
        path = fspath.normalize(path).replace(":.", ":\\")
        var response = (await getFiles(path))
            .filter(n => hiddenIncluded ? true : !n.isHidden)
        let items = [{
                name: "..",
            isNotSelectable: true,
                isDirectory: true
            }]
            .concat(response.filter(n => n.isDirectory))
            .concat(response.filter(n => !n.isDirectory))
        if (items && items.length)
            currentPath = path
        return { items, path }
    }    

    const getSortFunction = (column, isSubItem) => {
        switch (column) {
            case 0:
                return isSubItem == false 
                    ? ([a, b]) => a.name.localeCompare(b.name)
                    : ([a, b]) => getExtension(a.name).localeCompare(getExtension(b.name))
            case 1: 
                return ([a, b]) => (a.exifTime ? a.exifTime : a.time) - (b.exifTime ? b.exifTime : b.time)
            case 2: 
                return ([a, b]) => a.size - b.size
            case 3:
                return ([a, b]) => compareVersion(a.version, b.version)
            default:
                return null
        }
    }

    const saveWidths = widths => localStorage.setItem(`${folderId}-directory-widths`, JSON.stringify(widths))

    const getItem = item => currentPath == pathDelimiter ? pathDelimiter + item.name : currentPath + pathDelimiter + item.name

    const addExtendedInfos = async (path, items, refresh) => {
        for (let i = 0; i < items.length; i++ ) {
            const n = items[i]
            await addExtendedInfo(n, path)
            if (i != 0 && i % 50 == 0)
                refresh()
        }
        refresh()
    }

    const disableSorting = (table, disable) => {
        table.disableSorting(1, disable)
        adaptDisableSorting(table, disable)
    }

    const getIconPath = name => currentPath + pathDelimiter + name

    const createFolder = newFolder => runCmd({
        method: "createFolder", 
        path: fspath.join(currentPath, newFolder)
    })
    
    const deleteItems = items => platformDeleteItems(items.map(n => fspath.join(currentPath, n)))

    async function extractFilesInFolders(sourcePath, targetPath, items) {
        const extractFiles = async (path, target) => await extractFilesInFolders(path, target, await readdir(path))

        const paths = (await Promise.all(items.map(async n => {
            const file = fspath.join(sourcePath, n)
            const targetFile = fspath.join(targetPath, n)
            const info = await stat(file)
            return info.isDirectory() 
                ? extractFiles(file, targetFile) 
                : { file, 
                    targetFile, 
                    targetExists: fs.existsSync(targetFile)
                } 
        }))).flatMap(n => n)
        return paths
    }

    async function getCopyConflicts(info, sourcePath) {

        const getInfos = async (file, subPath) => {
            const info = await stat(file)
            return await enhanceCopyConflictData({  
                file,       
                name: subPath ? file.substr(subPath.length + 1) : undefined,
                size: info.size,
                time: info.mtime,
            })
        }

        return await Promise.all(
            info
            .filter(n => n.targetExists)
            .map(async n => ({ source: await getInfos(n.file, sourcePath), target: await getInfos(n.targetFile) }))
        )
    }

    const prepareCopyItems = async (move, itemsType, several, fromLeft, copyInfo) => {
        const moveOrCopy = move ? "verschieben" : "kopieren"
        const text = copyInfo.conflicts.length == 0
            ? itemsType == FILE 
                ? several
                    ? `Möchtest Du die Datei ${moveOrCopy}?`
                    : `Möchtest Du die Dateien ${moveOrCopy}?`
                : itemsType == DIRECTORY
                ?  several
                    ? `Möchtest Du den Ordner ${moveOrCopy}?`
                    : `Möchtest Du die Ordner ${moveOrCopy}?`
                : `Möchtest Du die Einträge ${moveOrCopy}?`
            : itemsType == FILE 
                ? several
                    ? `Datei ${moveOrCopy}, Einträge überschreiben?`
                    : `Dateien ${moveOrCopy}, Einträge überschreiben?`
                : itemsType == DIRECTORY
                ?  several
                    ? `Ordner ${moveOrCopy}, Einträge überschreiben?`
                    : `Ordner ${moveOrCopy}, Einträge überschreiben?`
                : `Möchtest Du die Einträge ${moveOrCopy}, Einträge überschreiben?`
        
        copyInfo.dialogData = {
            text,
            slide: fromLeft,
            slideReverse: !fromLeft,
            btnCancel: true
        }
        if (copyInfo.conflicts.length == 0) 
            copyInfo.dialogData.btnOk = true
        else {
            const copyConflicts = document.getElementById('copy-conflicts')
            copyConflicts.setItems(copyInfo.conflicts)
            copyInfo.dialogData.extended = "copy-conflicts"
            copyInfo.dialogData.btnYes = true
            copyInfo.dialogData.btnNo = true
            copyInfo.dialogData.fullscreen = true
            copyInfo.dialogData.extendedFocusables = [copyConflicts]
            const notOverwrite = copyInfo.conflicts.filter(n => n.source.time.getTime() < n.target.time.getTime()).length > 0
            if (notOverwrite)
                copyInfo.dialogData.defBtnNo = true
            else
                copyInfo.dialogData.defBtnYes = true
        }

        return copyInfo 
    }

    const copyItems = platformCopyItems

    const deleteEmptyFolders = platformDeleteEmptyFolders

    const renameItem = async (item, newName) => await platformRenameItem(fspath.join(currentPath, item), fspath.join(currentPath, newName))

    return {
        getType,
        getColumns,
        renderRow,
        getCurrentPath,
        getPath,
        getItems,
        getSortFunction,
        saveWidths,
        getItem,
        getIconPath,
        addExtendedInfos,
        disableSorting,
        createFolder,
        deleteItems,
        extractFilesInFolders,
        getCopyConflicts,
        prepareCopyItems,
        copyItems, 
        renameItem,
        deleteEmptyFolders
    }
}
