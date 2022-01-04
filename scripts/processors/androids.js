import { ROOT_PATH } from "./root.js"

export const ANDROID_TYPE = "android"
export const ANDROID_PATH = "android"

export const getAndroid = folderId => {
    const getType = () => ANDROID_TYPE

    const getColumns = () => {
        // TODO Test Windows

        // TODO + Android hinzufügen...

        // TODO when columns are specified
        //const widthstr = localStorage.getItem(`${folderId}-android-widths`)
        //const widths = widthstr ? JSON.parse(widthstr) : []
        const widths = []
        let columns = [{
            name: "Name",
            render: (td, item) => {
                const selector = item.name == ".." 
                ? '#parentIcon' 
                : '#androidIcon'
                var t = document.querySelector(selector)
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "Bezeichnung",
            render: (td, item) => td.innerHTML = item.description || ""
        }]
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    const getItems = async () => {
        return {
            path: "android/",
            items: [{ name: ".." }]
        }
    }

    const disableSorting = (table, disable) => {}

    const renderRow = (item, tr) => {
        tr.ondragstart = undefined
        tr.ondrag = undefined
        tr.ondragend = undefined
    }

    const getItem = item => item.name

    const getPath = item => [ROOT_PATH, null]

    return {
        getType,
        getColumns,
        getItems,
        disableSorting,
        renderRow,
        getItem,
        getPath
    }    
}