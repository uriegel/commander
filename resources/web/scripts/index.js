import './components/gridsplitter.js'
import './components/pdfviewer.js'
import './components/DialogBoxComponent.js'
import './folder.js'
import { request } from "./requests.js"
import {onTheme as onViewerTheme, onShowViewer, refreshViewer} from './viewer.js'
import { RESULT_OK } from './components/DialogBoxComponent.js'

const folderLeft = document.getElementById("folderLeft")
const folderRight = document.getElementById("folderRight")
const splitter = document.getElementById('splitter')
const dialog = document.querySelector('dialog-box-component')

const DIRECTORY = 1
const FILE = 2
const BOTH = 3

initializeCallbacks(onTheme, onShowHidden, show => {
    onShowViewer(show, currentPath)
    folderLeft.onResize()
    folderRight.onResize()
})

function getItemsTypes(selectedItems) {
    const types = selectedItems
        .map(n => n.isDirectory)
        .filter((item, index, resultList) => resultList
            .findIndex(n => n == item) == index)
    return types.length == 1
    ? types[0] ? DIRECTORY : FILE
    : BOTH
}

;(() => {
    const initialTheme = localStorage.getItem("theme") || "themeAdwaita"
    onTheme(initialTheme)
    setInitialTheme(initialTheme) 
})()

folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)

const onPathChanged = evt => {
    currentPath = evt.detail.path
    refreshViewer(evt.detail.path)
    setTitle(evt.detail.path, evt.detail.dirs, evt.detail.files)
}

folderLeft.addEventListener("pathChanged", onPathChanged)
folderRight.addEventListener("pathChanged", onPathChanged)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())
folderLeft.addEventListener("delete", evt => onDelete(evt.detail))
folderRight.addEventListener("delete", evt => onDelete(evt.detail))
folderLeft.addEventListener("copy", evt => onCopy(evt.detail, folderRight.getCurrentPath()))
folderRight.addEventListener("copy", evt => onCopy(evt.detail, folderLeft.getCurrentPath()))

async function onCopy(itemsToDelete, path) {
    const itemsType = getItemsTypes(itemsToDelete)
    const text = itemsType == FILE 
        ? itemsToDelete.length == 1 
            ? "M??chtest Du die Datei kopieren?"
            : "M??chtest Du die Dateien kopieren?"
        : itemsType == DIRECTORY
        ?  itemsToDelete.length == 1 
            ? "M??chtest Du den Ordner kopieren?"
            : "M??chtest Du die Ordner kopieren?"
        : "M??chtest Du die Eintr??ge kopieren?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK)
        await request("copy", {
            sourcePath: activeFolder.getCurrentPath(),
            destinationPath: path,
            items: itemsToDelete.map(n => n.name)
        })
}

async function onDelete(itemsToDelete) {
    const itemsType = getItemsTypes(itemsToDelete)
    const text = itemsType == FILE 
        ? itemsToDelete.length == 1 
            ? "M??chtest Du die Datei l??schen?"
            : "M??chtest Du die Dateien l??schen?"
        : itemsType == DIRECTORY
        ?  itemsToDelete.length == 1 
            ? "M??chtest Du den Ordner l??schen?"
            : "M??chtest Du die Ordner l??schen?"
        : "M??chtest Du die Eintr??ge l??schen?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
    // if (res.result == RESULT_OK)
    //     addDeleteJob(activeFolder.id, activeFolder.getCurrentPath(), itemsToDelete.map(n => n.name))
}

function onTheme(theme) {
    ["themeAdwaita", "themeAdwaitaDark"].forEach(n => {
        document.body.classList.remove(n)
        splitter.classList.remove(n)
        dialog.classList.remove(n) 
    })
    document.body.classList.add(theme)    
    splitter.classList.add(theme)    
    folderLeft.changeTheme(theme)
    folderRight.changeTheme(theme)
    dialog.classList.add(theme)        
    onViewerTheme(theme)
    localStorage.setItem("theme", theme)
}

function onShowHidden(hidden) {
    folderLeft.showHidden(hidden)
    folderRight.showHidden(hidden)
}

folderLeft.setFocus()

document.addEventListener("keydown", async evt => {
    switch (evt.which) {
        case 118: // F7
            const item = activeFolder.getSelectedItem()
            const res = await dialog.show({
                text: "Ordner anlegen",
                input: true,
                inputText: item != ".." ? item : "",
                defBtnOk: true,
                btnOk: true,
                btnCancel: true
            })    
            activeFolder.setFocus()
            evt.preventDefault()
            evt.stopPropagation()
            break
        case 120: { // F9
            const inactiveFolder = activeFolder == folderLeft ? folderRight : folderLeft
            inactiveFolder.changePath(activeFolder.getCurrentPath())
            evt.preventDefault()
            evt.stopPropagation()
            break
        }
    }
})

var activeFolder = folderLeft
var currentPath = ""






