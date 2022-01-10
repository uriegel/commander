export const DIRECTORY_TYPE = "directory"
import { formatDateTime, formatSize, getExtension, compareVersion } from "./rendertools.js"
import { ROOT } from "./root.js"
import { FILE, DIRECTORY } from '../commander.js'
const { getExifDate } = window.require('../index.node')
//const { getExifDate } = window.require('filesystem-utilities')
import {
    pathDelimiter,
    adaptDirectoryColumns,
    parentIsRoot,
    adaptDisableSorting,
    addExtendedInfo as addAdditionalInfo,
    deleteItems as platformDeleteItems,
    copyItems as platformCopyItems,
    renameItem as platformRenameItem,
    deleteEmptyFolders as platformDeleteEmptyFolders,
    enhanceCopyConflictData 
} from "../platforms/switcher.js"

const { getFiles } = window.require('../index.node')
const fspath = window.require('path')
const fs = window.require('fs')
const { stat } = window.require('fs/promises')

export const getDirectory = (folderId, path) => {
    const getType = () => DIRECTORY_TYPE
    
    let currentPath = ""
    let extendedRename = false

    const getColumns = extendedRenameToSet => {
        extendedRename = extendedRenameToSet
        const widthstr = localStorage.getItem(`${folderId}-${(extendedRename ? "extended-" : "")}directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = adaptDirectoryColumns([{
            name: "Name",
            isSortable: true,
            sortIndex: 1,
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
            sortIndex: 2,
            render: (td, item) => {
                td.innerHTML = formatDateTime(item.exifTime || item.time)
                if (item.exifTime)
                    td.classList.add("exif")
            }
        }, {
            name: "Größe",
            isSortable: true,
            sortIndex: 3,
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.size)
                td.classList.add("rightAligned")
            }
        }])
        if (extendedRename) 
            columns.splice(1, 0, { name: "Neuer Name", render: (td, item) => { td.innerHTML = item.newName || ""}})
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

    const getPath = async item => item.isDirectory 
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
        var response = ( getFiles(path))
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
            case 1:
                return isSubItem == false 
                    ? ([a, b]) => a.name.localeCompare(b.name)
                    : ([a, b]) => getExtension(a.name).localeCompare(getExtension(b.name))
            case 2: 
                return ([a, b]) => (a.exifTime ? a.exifTime : a.time) - (b.exifTime ? b.exifTime : b.time)
            case 3: 
                return ([a, b]) => a.size - b.size
            case 4:
                return ([a, b]) => compareVersion(a.version, b.version)
            default:
                return null
        }
    }

    const saveWidths = widths => localStorage.setItem(`${folderId}-${(extendedRename ? "extended-" : "")}directory-widths`, JSON.stringify(widths))

    const getItem = item => currentPath == pathDelimiter ? pathDelimiter + item.name : currentPath + pathDelimiter + item.name

    async function addExtendedInfo(item, path) {
        
        const getExifDateAsync = file => new Promise(res => getExifDate(file, date => res(date ? new Date(date) : null)))
        
        var name = item.name.toLocaleLowerCase();
        if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
            item.exifTime = await getExifDateAsync(fspath.join(path, item.name))
            item.exifTime = await getExifDateAsync(fspath.join(path, item.name))
        await addAdditionalInfo(item, name, path)
    }
    
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

    async function extractFilesInFolders(sourcePath, targetPath, items, sourceFolder) {

        const extractFiles = async (path, target) => await extractFilesInFolders(path, target, await sourceFolder.readDir(path), sourceFolder)

        const paths = (await Promise.all(items.map(async n => {
            const file = fspath.join(sourcePath, n.name)
            const targetFile = fspath.join(targetPath, n.name)
            return n.isDirectory
                ? extractFiles(file, targetFile) 
                : { file, 
                    targetFile, 
                    targetExists: fs.existsSync(targetFile)
                } 
        }))).flatMap(n => n)
        return paths
    }

    const getCopyConflicts = async (info, sourcePath, sourceFolder) => {
        const conflicts = info.filter(n => n.targetExists)
        const sources = await sourceFolder.getFilesInfos(conflicts.map(n => n.file), sourcePath)
        const targets = await getFilesInfos(conflicts.map(n => n.targetFile))
        return sources.map((n, i) => ({source: n, target: targets[i]}))
    }

    const getFilesInfos = async (files, subPath) => {
        const getFileInfos = async file => {
            const info = await stat(file)
            return await enhanceCopyConflictData({  
                file,       
                name: subPath ? file.substr(subPath.length + 1) : undefined,
                size: info.size,
                time: info.mtime,
            })
        }
        return await Promise.all(files.map(getFileInfos))
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

    const readDir = async path => {
        path = fspath.normalize(path).replace(":.", ":\\")
        return await getFiles(path)
    }

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
        deleteEmptyFolders,
        readDir,
        getFilesInfos
    }
}
