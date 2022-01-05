import { ANDROID_PATH } from "./androids"
import { formatDateTime, formatSize, getExtension } from "./rendertools.js"
import { copyProcessor } from "../processors/copyProcessor.js"
const http = window.require('http')

export const ANDROID_TYPE = "android"

export const getAndroid = (folderId, path) => {
    const ip = path.substring(8, path.indexOf('/', 9)) 
    const rootPath = `android/${ip}/`
    const pathBegin = rootPath.length - 1
    const getType = () => ANDROID_TYPE

    let currentPath = ""

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-android-widths`)
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

    const getItems = async (path, hiddenIncluded) => {
        var response = (await getFiles(path.substring(pathBegin)))
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

    const getPath = async item => item.isDirectory 
        ? item.name != ".."
            ? [
                currentPath.length == pathBegin + 1 ?  `${currentPath}${item.name}` : `${currentPath}/${item.name}`, 
                null]
            : currentPath == rootPath  
                ? [ANDROID_PATH, null]
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

    const saveWidths = widths => localStorage.setItem(`${folderId}-android-widths`, JSON.stringify(widths))

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

    const getFiles = path => request("getfiles", { path })
    
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

    async function request(path, data) {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify(data)
            let responseData = ''
            const req = http.request({
                hostname: ip,
                port: 8080,
                path,
                agent: keepAliveAgent,
                timeout: 40000,
                method: 'POST',
                headers: {
					'Content-Type': 'application/json; charset=UTF-8',
					'Content-Length': Buffer.byteLength(payload)
				}            
            }, response => {
                response.setEncoding('utf8')
                response.on('data', chunk => responseData += chunk)
                response.on('end', () => {
                    const result = JSON.parse(responseData)
                    resolve(result)
                })
            })        
            
            req.on('error', e => {
                console.log("error", "problem with request", e)
                reject(e)
            })
            req.write(payload)
            req.end()        
        }) 
    }    

    // TODO Test copying in Windows (initializecopyProcessor)
    return {
        getType,
        getColumns,
        getItems,
        renderRow,
        getPath,
        disableSorting,
        getItem,
        addExtendedInfos,
        getCurrentPath,
        saveWidths,
        getSortFunction,
        extractFilesInFolders,
        readDir,
        copyItems
    }
}