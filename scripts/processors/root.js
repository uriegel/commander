import { formatSize } from "./rendertools.js"
import { adaptRootColumns, getRootPath } from '../platforms/switcher.js'
const addon = window.require('filesystem-utilities')

export const ROOT = "root"

export const getRoot = folderId => {
    const getType = () => ROOT

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-root-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = adaptRootColumns([{
            name: "Name",
            render: (td, item) => {
                var t = document.querySelector('#driveIcon')
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "Bezeichnung",
            render: (td, item) => td.innerHTML = item.description
        }, {
            name: "Größe",
            isRightAligned: true,
            render: (td, item) => {
                td.innerHTML = formatSize(item.size)
                td.classList.add("rightAligned")
            }
        }])
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    const renderRow = (item, tr) => {
        if (!item.isMounted)
            tr.style.opacity = 0.5
    }

    const getCurrentPath = () => ROOT

    const getItems = async () => {
        const items = (await addon.getDrives())
            .map(n => {
                n.isNotSelectable = true
                return n
            })
        return  { items, path: ROOT }
    }

    const addExtendedInfos = () => []

    const saveWidths = widths => localStorage.setItem(`${folderId}-root-widths`, JSON.stringify(widths))

    const getItem = item => item.name

    const createFolder = async newFolder => { }

    const disableSorting = () => {}

    return {
        getType,
        getColumns,
        getItems,
        renderRow,
        saveWidths, 
        getCurrentPath,
        getPath: getRootPath,
        getItem,
        addExtendedInfos,
        disableSorting,
        createFolder
    }
}