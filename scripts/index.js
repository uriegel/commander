import 'grid-splitter'
import 'web-dialog-box'
import'web-menu-bar'
import 'web-electron-titlebar'
import './components/pdfviewer.js'
import './folder.js'
import { onShowViewer, refreshViewer} from './viewer.js'
import './menu.js'

const folderLeft = document.getElementById("folderLeft")
const folderRight = document.getElementById("folderRight")
const dialog = document.querySelector('dialog-box')

const DIRECTORY = 1
const FILE = 2
const BOTH = 3

initializeCallbacks(onShowHidden, show => {
    onShowViewer(show, currentPath)
    folderLeft.onResize()
    folderRight.onResize()
}, refresh, adaptPath)

function getItemsTypes(selectedItems) {
    const types = selectedItems
        .map(n => n.isDirectory)
        .filter((item, index, resultList) => resultList
            .findIndex(n => n == item) == index)
    return types.length == 1
    ? types[0] ? DIRECTORY : FILE
    : BOTH
}

// if (isLinux) {
//     const titlebar = document.getElementById("titlebar")
//     const menu = document.getElementById("menu")
//     menu.remove()
//     titlebar.parentElement.insertBefore(menu, titlebar)
//     titlebar.remove()
// }

// const themeChanges = window.require('windows-theme-changes')
// themeChanges.register(lightTheme => {
//     onDarkTheme(!lightTheme)
// })
// onDarkTheme(!themeChanges.isLightMode())

folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)

const onPathChanged = evt => {
    currentPath = evt.detail.path
    refreshViewer(evt.detail.path)
    setTitle(evt.detail.path, evt.detail.dirs, evt.detail.files)
}

function setTitle(path, dirs, files) { console.log(path, dirs, files)}

function refresh(folderId) {
    const folder = 
        folderId 
        ? folderId == "folderLeft" ? folderLeft : folderRight
        : activeFolder
    folder.reloadItems()
}

function onException(text) {
    setTimeout(async () => {
        await dialog.show({
            text,
            btnOk: true
        })
        activeFolder.setFocus()        
    },
    // TODO stack MessageBoxes
    500)
}

folderLeft.addEventListener("pathChanged", onPathChanged)
folderRight.addEventListener("pathChanged", onPathChanged)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())
folderLeft.addEventListener("rename", evt => onRename(evt.detail))
folderRight.addEventListener("rename", evt => onRename(evt.detail))
folderLeft.addEventListener("delete", evt => onDelete(evt.detail))
folderRight.addEventListener("delete", evt => onDelete(evt.detail))
folderLeft.addEventListener("copy", evt => onCopy(evt.detail, folderRight.getCurrentPath()))
folderRight.addEventListener("copy", evt => onCopy(evt.detail, folderLeft.getCurrentPath()))
folderLeft.addEventListener("move", evt => onMove(evt.detail, folderRight.getCurrentPath()))
folderRight.addEventListener("move", evt => onMove(evt.detail, folderLeft.getCurrentPath()))
folderLeft.addEventListener("createFolder", evt => onCreateFolder(evt.detail))
folderRight.addEventListener("createFolder", evt => onCreateFolder(evt.detail))

async function onCopy(itemsToCopy, path) {
    const itemsType = getItemsTypes(itemsToCopy)
    const text = itemsType == FILE 
        ? itemsToCopy.length == 1 
            ? "Möchtest Du die Datei kopieren?"
            : "Möchtest Du die Dateien kopieren?"
        : itemsType == DIRECTORY
        ?  itemsToCopy.length == 1 
            ? "Möchtest Du den Ordner kopieren?"
            : "Möchtest Du die Ordner kopieren?"
        : "Möchtest Du die Einträge kopieren?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
//    if (res.result == RESULT_OK)
        // await request("copy", {
        //     id: getInactiveFolder().id,
        //     sourcePath: activeFolder.getCurrentPath(),
        //     destinationPath: path,
        //     directories: itemsToCopy.filter(n => n.isDirectory).map(n => n.name),
        //     files: itemsToCopy.filter(n => !n.isDirectory).map(n => n.name)
        // })
}

async function onMove(itemsToMove, path) {
    const itemsType = getItemsTypes(itemsToMove)
    const text = itemsType == FILE 
        ? itemsToMove.length == 1 
            ? "Möchtest Du die Datei verschieben?"
            : "Möchtest Du die Dateien verschieben?"
        : itemsType == DIRECTORY
        ?  itemsToMove.length == 1 
            ? "Möchtest Du den Ordner verschieben?"
            : "Möchtest Du die Ordner verschieben?"
        : "Möchtest Du die Einträge verschieben?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK) {
        await request("move", {
            ids: [ activeFolder.id, getInactiveFolder().id ],
            sourcePath: activeFolder.getCurrentPath(),
            destinationPath: path,
            directories: itemsToMove.filter(n => n.isDirectory).map(n => n.name),
            files: itemsToMove.filter(n => !n.isDirectory).map(n => n.name)
        })
    }
}

async function onRename(itemToRename) {
    const itemsType = getItemsTypes(itemToRename)
    const text = itemsType == FILE 
        ? "Datei umbenennen"
        : "Ordner umbenennen"
    
    const getInputRange = () => {
        const pos = itemToRename[0].name.lastIndexOf(".")
        if (pos == -1)
            return [0, itemToRename[0].name.length]
        else
            return [0, pos]
    }

    const res = await dialog.show({
        text,
        input: true,
        inputText: itemToRename[0].name,
        inputSelectRange: getInputRange(),
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK)
        await request("rename", {
            id: activeFolder.id,
            path: activeFolder.getCurrentPath(),
            item: itemToRename[0].name,
            newName: res.input,
            isDirectory: itemsType == DIRECTORY
        })
}

async function onDelete(itemsToDelete) {
    const itemsType = getItemsTypes(itemsToDelete)
    const text = itemsType == FILE 
        ? itemsToDelete.length == 1 
            ? "Möchtest Du die Datei löschen?"
            : "Möchtest Du die Dateien löschen?"
        : itemsType == DIRECTORY
        ?  itemsToDelete.length == 1 
            ? "Möchtest Du den Ordner löschen?"
            : "Möchtest Du die Ordner löschen?"
        : "Möchtest Du die Einträge löschen?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK)
        await request("delete", {
            id: activeFolder.id,
            sourcePath: activeFolder.getCurrentPath(),
            Items: itemsToDelete.map(n => n.name)
        })
}

async function onCreateFolder(selectedItem) {

    const res = await dialog.show({
        text: "Neuen Ordner anlegen",
        input: true,
        inputText: selectedItem.length == 1 ? selectedItem[0].name : "",
        btnOk: true,
        btnCancel: true,
        defBtnOk: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK)
        await request("createFolder", {
            id: activeFolder.id,
            path: activeFolder.getCurrentPath(),
            newName: res.input
        })
}

function onDarkTheme(darkTheme) {
    if (darkTheme)
        document.body.classList.add("themeDark")
    else
        document.body.classList.remove("themeDark")
}

function onShowHidden(hidden) {
    folderLeft.showHidden(hidden)
    folderRight.showHidden(hidden)
}

folderLeft.setFocus()

const getInactiveFolder = () => activeFolder == folderLeft ? folderRight : folderLeft

function adaptPath() {
    getInactiveFolder().changePath(activeFolder.getCurrentPath())
}

var activeFolder = folderLeft
var currentPath = ""

// TODO Linux Electron-titlebar hide mode: only menu, perhaps automode
// TODO Linux and windows: dark-theme-detect addon: gsettings get org.gnome.desktop.interface gtk-theme ||| settings monitor org.gnome.desktop.interface gtk-theme
// TODO Linux detect os, different font size
// TODO Linux root like linux-commander
// TODO Linux directory like linux-commander
// TODO Status bar with progress

// TODO VirtualTable: rightAligned 5px padding right (attribute)
// TODO VirtualTable: scrollbargrip minimal size bigger, scrolling right side is difficult
// TODO sorting date version: disable until extendedInfos 
// TODO sorting date version: disable until extendedInfos in Linux
// TODO sorting version
// TODO img, video and pdf viewer
// TODO Menubar support num+ num-
// TODO copy, ...




