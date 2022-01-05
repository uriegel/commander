import { ANDROID_PATH } from "./androids"
import { formatDateTime, formatSize, getExtension } from "./rendertools.js"
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
//        if (items && items.length)

        var response = await getFiles(path.substring(pathBegin))
        console.log(response)

        currentPath = path
        
        return {
            path,
            items: [{ name: "..", isDirectory: true }]
        }
    }

    const getPath = async item => item.isDirectory 
        ? item.name != ".."
            ? [
                `${currentPath}/${item.name}`, 
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

    const getItem = item => currentPath == `${currentPath}/${item.name}`

    const data = JSON.stringify({
        path,
        count: 234
    })

    const getFiles = path => request("getfiles", { path })

    async function request(path, data) {
        const keepAliveAgent = new http.Agent({
            keepAlive: true,
            keepAliveMsecs: 40000
        })

        return new Promise((resolve, reject) => {
            var payload = JSON.stringify(data)
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
                response.on('data', chunk => {
                    const result = JSON.parse(chunk)
                    resolve(result)
                })
                response.on('end', () => {
                    // console.log('No more data in response.')
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

    return {
        getType,
        getColumns,
        getItems,
        renderRow,
        getPath,
        disableSorting,
        getItem,
        addExtendedInfos
    }
}