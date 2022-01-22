import { RESULT_OK } from "web-dialog-box"
import { dialog } from "../commander.js"
import { ROOT_PATH } from "./root.js"

export const EXTERNALS_TYPE = "externals"
export const EXTERNALS_PATH = "externals"

let items = JSON.parse(localStorage.getItem("externals") || "[]")

export const getExternals = folderId => {
    const getType = () => EXTERNALS_TYPE

    const getColumns = () => {
        const widthstr = localStorage.getItem(`${folderId}-externals-widths`)
        const widths = widthstr ? JSON.parse(widthstr) : []
        let columns = [{
            name: "Name",
            render: (td, item) => {
                const selector = item.type == "parent" 
                ? '#parentIcon' 
                : item.type == "add" 
                ? '#newIcon'
                : item.type == "android" 
                ? '#androidIcon'
                : '#remoteIcon'
                var t = document.querySelector(selector)
                td.appendChild(document.importNode(t.content, true))
                const span = document.createElement('span')
                span.innerHTML = item.name
                td.appendChild(span)
            }
        }, {
            name: "IP-Adresse",
            render: (td, item) => td.innerHTML = item.ip || ""
        }]
        if (widths)
            columns = columns.map((n, i) => ({ ...n, width: widths[i] }))
        return columns
    }

    const getItems = async () => {
        return {
            path: EXTERNALS_PATH,
            items: [{ name: "..", type: "parent" }]
                    .concat(items)
                    .concat({ name: "Hinzufügen...", type: "add"})
        }
    }

    const disableSorting = (table, disable) => {}

    const renderRow = (item, tr) => {
        tr.ondragstart = undefined
        tr.ondrag = undefined
        tr.ondragend = undefined
    }

    const getItem = item => item.name

    const getPath = async (item, refresh) => {
        if (item.type == "parent")
            return [ROOT_PATH, null]
        else if (item.type == "add") {
            const externalAdder = document.getElementById('external-adder')
            const inputs = [...externalAdder.querySelectorAll("input")]
            const adderName = document.getElementById("adder-name")
            adderName.value = ""
            const adderIp = document.getElementById("adder-ip")
            adderIp.value = ""
            const res = await dialog.show({
                text: "Remote-Verbindung anlegen",
                extended: "external-adder",
                extendedFocusables: inputs,
                btnOk: true,
                btnCancel: true,
                defBtnOk: true
            })    
            if (res.result == RESULT_OK) {
                const name = adderName.value
                const ip = adderIp.value
                items = items.concat([{name, ip}])
                localStorage.setItem("externals", JSON.stringify(items))
                refresh()
            }
            return [null, null]
        } else
            return [`external/${item.ip}/`, null]
    }

    const saveWidths = widths => localStorage.setItem(`${folderId}-externals-widths`, JSON.stringify(widths))

    const getCurrentPath = () => EXTERNALS_PATH

    const deleteItems = itemsToDelete => {
        items = items.filter(n => !itemsToDelete.includes(n.name))
        localStorage.setItem("externals", JSON.stringify(items))
    }

    const addExtendedInfos = () => []

    const onEnter = () => {}

    return {
        getType,
        getColumns,
        getItems,
        disableSorting,
        renderRow,
        getItem,
        getPath,
        saveWidths,
        getCurrentPath,
        deleteItems,
        addExtendedInfos,
        onEnter
    }    
}
