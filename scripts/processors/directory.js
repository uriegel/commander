export const DIRECTORY = "directory"
import { formatDateTime, formatSize, getExtension } from "./rendertools.js"
import { ROOT } from "./root.js"
const addon = window.require('filesystem-utilities')
const fspath = window.require('path')

const pathDelimiter = isLinux ? "/" : "\\"

export const getDirectory = (folderId, path) => {
    const getType = () => DIRECTORY
    
    let currentPath = ""

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-directory-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = [{
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
                    if (ext) {
                        // if (ext == "exe") {
                        //    img.src = `icon://${}`
                        // } else 
                        img.src = `icon://${ext}`
                        //img.src = `http://localhost:9865/commander/geticon?ext=${ext}`
                        
                        img.classList.add("image")
                        td.appendChild(img)
                    } else {
                        var t = document.querySelector(selector)
                        td.appendChild(document.importNode(t.content, true))
                    }
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
        }, isLinux
            ? null
            : {
            name: "Version",
            isSortable: true,
            render: (td, item) => {
                if (item.version)
                td.innerHTML = `${item.version.major}.${item.version.minor}.${item.version.patch}.${item.version.build}`
            }
        }].filter(n => !!n)
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    const renderRow = (item, tr) => {
        if (item.isHidden)
            tr.style.opacity = 0.5
    }

    const getParentDir = path => {
        let pos = path.lastIndexOf(pathDelimiter)
        let parent = pos ? path.substr(0, pos) : pathDelimiter
        return [parent, path.substr(pos + 1)]
    }
    
    const getCurrentPath = () => currentPath

    const parentIsRoot = () => isLinux
        ? currentPath == '/'
        : currentPath.length == 3 && currentPath[1] == ':'
    
    const getPath = item => item.isDirectory 
        ? item.name != ".."
            ? [
                currentPath != "\\" ? currentPath + pathDelimiter + item.name : currentPath + item.name, 
                null]
            : parentIsRoot()  
                ? [ROOT, null]
                : getParentDir(currentPath)
        : [null, null]

    const getItems = async (path, hiddenIncluded) => {
        path = fspath.normalize(path).replace(":.", ":\\")
        var response = (await addon.getFiles(path))
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
            default:
                return null
        }
    }

    const saveWidths = widths => localStorage.setItem(`${folderId}-directory-widths`, JSON.stringify(widths))

    const getItem = item => currentPath == pathDelimiter ? pathDelimiter + item.name : currentPath + pathDelimiter + item.name

    const addExtendedInfos = async (path, items, refresh) => {
        for (let i = 0; i < items.length; i++ ) {
            const n = items[i]
            var name = n.name.toLocaleLowerCase();
            if (!isLinux && name.endsWith(".exe") || name.endsWith(".dll")) 
                n.version = await addon.getFileVersion(fspath.join(path, n.name))
            else if (name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png"))
                n.exifTime = await addon.getExifDate(fspath.join(path, n.name))
            if (i != 0 && i % 50 == 0) 
                refresh()
        }
        refresh()
    }

    const disableSorting = (table, disable) => {
        table.disableSorting(1, disable)
        if (!isLinux)
            table.disableSorting(3, disable)
    }

    const getIconPath = name => currentPath + pathDelimiter + name

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
        disableSorting
    }
}
