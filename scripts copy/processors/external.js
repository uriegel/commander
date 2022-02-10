import { formatDateTime, formatSize, getExtension } from "./rendertools.js"
import { copyProcessor } from "../processors/copyProcessor.js"
const http = window.require('http')

export const EXTERNAL_TYPE = "external"
export const EXTERNAL_PATH = "external"

export const getExternal = (folderId, path) => {
    const ip = path.substring(8, path.indexOf('/', 9)) 
    const rootPath = `external/${ip}/`
    const pathBegin = rootPath.length - 1
    const getType = () => EXTERNAL_TYPE

    let currentPath = ""

    const getColumns = () => {

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
                        img.src = `icon://${ext}`
                        img.classList.add("image")
                        td.appendChild(img)
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
        }]
        if (widths)
            columns = columns.map((n, i)=> ({ ...n, width: widths[i]}))
        return columns
    }

    const getPath = async item => item.isDirectory 
        ? item.name != ".."
            ? [
                currentPath.length == pathBegin + 1 ?  `${currentPath}${item.name}` : `${currentPath}/${item.name}`, 
                null]
            : currentPath == rootPath  
                ? [EXTERNAL_PATH, null]
                : getParentDir(currentPath)
        : [null, null]

    const renderRow = (item, tr) => {
        tr.setAttribute("draggable", "true")
        if (item.isHidden)
            tr.style.opacity = 0.5
    }

    const getParentDir = path => {
        let pos = path.lastIndexOf('/')
        let parent = pos ? path.substr(0, pos) : '/'
        return [parent, path.substr(pos + 1)]
    }

    const addExtendedInfos = async (path, items, refresh) => {
        // for (let i = 0; i < items.length; i++ ) {
        //     const n = items[i]
        //     await addExtendedInfo(n, path)
        //     if (i != 0 && i % 50 == 0)
        //         refresh()
        // }
        // refresh()
    }

    const disableSorting = (table, disable) => table.disableSorting(1, disable)

    const getCurrentPath = () => currentPath

    const getItem = item => currentPath == `${currentPath}/${item.name}`

    const saveWidths = widths => localStorage.setItem(`${folderId}-external-widths`, JSON.stringify(widths))

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

    const readDir = async path => {
        return await getFiles(path)
    }

    const copyItems = async (copyInfo, move, overwrite, foldersToRefresh) => {
        copyInfo.items.forEach(n => copyProcessor.addJob(n.file, n.targetFile, move, overwrite, foldersToRefresh, true))
    }

    const getFilesInfos = async (files, subPath) => {
        if (!files || files.length == 0)
            return []
        const fileInfos = await request("getfilesinfos", { files: files.map(n => n.substring(pathBegin)) })
        return fileInfos.map(n => ({
            file: n.file,
            name: subPath ? n.file.substr(subPath.length + 1) : undefined,
            size: n.size,
            time: new Date(n.time)
        }))
    }

    async function extractFilesInFolders(sourcePath, targetPath, items) {

        const readdir = async path => (await getFiles(path)).map(n => ({ name: n.name, isDirectory: n.isDirectory}))

        const extractFiles = async (path, target) => await extractFilesInFolders(path, target, await readdir(path))

        const paths = (await Promise.all(items.map(async n => {
            const file = fspath.join(sourcePath, n.name)
            const targetFile = fspath.join(targetPath, n.name)
            return n.isDirectory() 
                ? extractFiles(file, targetFile) 
                : { file, 
                    targetFile, 
                    targetExists: fs.existsSync(targetFile)
                } 
        }))).flatMap(n => n)
        return paths
    }

    const deleteEmptyFolders = () => {}
}