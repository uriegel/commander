import { ROOT_PATH } from "./root.js"

export const ANDROID_TYPE = "android"
export const ANDROID_PATH = "android"

export const getAndroid = folderId => {
    const getType = () => ANDROID_TYPE

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-androids-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = [{
            name: "Name",
            render: (td, item) => {
                const selector = item.type == "parent" 
                ? '#parentIcon' 
                : item.type == "add" 
                ? '#newIcon'
                : '#androidIcon'
                var t = document.querySelector(selector)
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "IP-Adresse",
            render: (td, item) => td.innerHTML = item.description || ""
        }]
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    const getItems = async () => {
        return {
            path: "android/",
            items: [
                { name: "..", type: "parent" },
                { name: "Hinzufügen...", type: "add"}
            ]
        }
    }

    const disableSorting = (table, disable) => {}

    const renderRow = (item, tr) => {
        tr.ondragstart = undefined
        tr.ondrag = undefined
        tr.ondragend = undefined
    }

    const getItem = item => item.name

    const getPath = item => {
        if (item.type == "parent")
            return [ROOT_PATH, null]
        else if (item.type == "add") {
            return [null, null]
        } else
            return [null, null]
    }

    const saveWidths = widths => localStorage.setItem(`${folderId}-androids-widths`, JSON.stringify(widths))

    const addExtendedInfos = () => []

    return {
        getType,
        getColumns,
        getItems,
        disableSorting,
        renderRow,
        getItem,
        getPath,
        saveWidths,
        addExtendedInfos
    }    
}

// TODO NewAndroid-Dialog Component: 2 inputs with placeholder