import 'grid-splitter'
import 'web-dialog-box'
import { RESULT_OK } from 'web-dialog-box'
import 'web-menu-bar'
import 'web-electron-titlebar'
import './components/pdfviewer.js'
import './components/pieprogress'
import './folder.js'
import { showViewer, refreshViewer} from './viewer.js'
import { initializeMenu } from './menu.js'
import { adaptWindow, onDarkTheme } from './platforms/switcher.js'
import { initializeCopying } from './platforms/copyProcessor.js'
const FileResult = window.require('filesystem-utilities').FileResult

const folderLeft = document.getElementById("folderLeft")
const folderRight = document.getElementById("folderRight")
const dialog = document.querySelector('dialog-box')
const statusText = document.getElementById("statusText")
const dirsText = document.getElementById("dirs")
const filesText = document.getElementById("files")
const progress = document.getElementById("progress")
const menu = document.getElementById("menu")

const DIRECTORY = 1
const FILE = 2
const BOTH = 3

function getItemsTypes(selectedItems) {
    const types = selectedItems
        .map(n => n.isDirectory)
        .filter((item, index, resultList) => resultList
            .findIndex(n => n == item) == index)
    return types.length == 1
    ? types[0] ? DIRECTORY : FILE
    : BOTH
}

adaptWindow(dialog, () => activeFolder.setFocus(), menu, document.getElementById("hidemenu"))

const themeChanges = window.require("theme-change-detect")
themeChanges.register(theme => onDarkTheme(theme.isDark))
onDarkTheme(themeChanges.getTheme().isDark)

menu.addEventListener('resize', () => {
    folderLeft.onResize()
    folderRight.onResize()        
})
menu.addEventListener('menuclosed', () => activeFolder.setFocus())

folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)

const copyProcessor = initializeCopying(onCopyProgress, onCopyFinish, onCopyException)

const onPathChanged = evt => {
    currentPath = evt.detail.path
    refreshViewer(evt.detail.path)
    setStatus(evt.detail.path, evt.detail.dirs, evt.detail.files)
}

function setStatus(path, dirs, files) {
    statusText.innerText = `${path}`
    dirsText.innerText = `${dirs ? dirs - 1 : "" } Verz.` 
    filesText.innerText = `${dirs ? files : "" } Dateien` 
}

function refresh(folderId) {
    const folder = 
        folderId 
        ? folderId == "folderLeft" ? folderLeft : folderRight
        : activeFolder
    folder.reloadItems()
}

function selectAll() {
    activeFolder.selectAll()
}

function selectNone() {
    activeFolder.selectNone()
}

folderLeft.addEventListener("pathChanged", onPathChanged)
folderRight.addEventListener("pathChanged", onPathChanged)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())
folderLeft.addEventListener("rename", evt => onRename(evt.detail))
folderRight.addEventListener("rename", evt => onRename(evt.detail))
folderLeft.addEventListener("delete", evt => onDelete(evt.detail))
folderRight.addEventListener("delete", evt => onDelete(evt.detail))

async function copy(move) {
    if (copyProcessor.inProgress())
        return

    const itemsToCopy = activeFolder.selectedItems
    const itemsType = getItemsTypes(itemsToCopy)
    const moveOrCopy = move ? "verschieben" : "kopieren"
    const text = itemsType == FILE 
        ? itemsToCopy.length == 1 
            ? `Möchtest Du die Datei ${moveOrCopy}?`
            : `Möchtest Du die Dateien ${moveOrCopy}?`
        : itemsType == DIRECTORY
        ?  itemsToCopy.length == 1 
            ? `Möchtest Du den Ordner ${moveOrCopy}?`
            : `Möchtest Du die Ordner ${moveOrCopy}?`
        : "Möchtest Du die Einträge ${moveOrCopy}?"

    const res = await dialog.show({
        text,
        btnOk: true,
        btnCancel: true
    })    
    activeFolder.setFocus()
    if (res.result == RESULT_OK) {
    // copyProcessor.add
        await getInactiveFolder().copyItems(activeFolder.getCurrentPath(), itemsToCopy.map(n => n.name), move)
        if (move)
            activeFolder.reloadItems()
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
    try {
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
            await activeFolder.deleteItems(itemsToDelete.map(n => n.name))
    } catch (e) {
        const text = e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : e.fileResult == FileResult.TrashNotPossible
                ? "Löschen in den Papierkorb nicht möglich"
                : "Die Aktion konnte nicht ausgeführt werden"
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
}

async function createFolder() {
    try {
        const selectedItems = activeFolder.selectedItems
        const res = await dialog.show({
            text: "Neuen Ordner anlegen",
            input: true,
            inputText: selectedItems.length == 1 ? selectedItems[0].name : "",
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })
        activeFolder.setFocus()
        if (res.result == RESULT_OK)
            await activeFolder.createFolder(res.input)
    } catch (e) {
        const text = e.fileResult == FileResult.FileExists
            ? "Die angegebene Datei existiert bereits"
            : e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : "Die Aktion konnte nicht ausgeführt werden"
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
}

function showHidden(hidden) {
    folderLeft.showHidden(hidden)
    folderRight.showHidden(hidden)
}

folderLeft.setFocus()

const getInactiveFolder = () => activeFolder == folderLeft ? folderRight : folderLeft

function adaptPath() {
    getInactiveFolder().changePath(activeFolder.getCurrentPath())
}

function onCopyProgress(current, total) {
    console.log("copy progress", current, total)
}

function onCopyFinish() {
    console.log("copy finish")
}

function onCopyException() {
    console.log("copy exception")
}

var activeFolder = folderLeft
var currentPath = ""

var commander = {
    showHidden,
    showViewer: show => {
        showViewer(show, currentPath)
        folderLeft.onResize()
        folderRight.onResize()
    },
    refresh,
    adaptPath,
    createFolder,
    copy,
    selectAll,
    selectNone
}

initializeMenu(commander)


const testprogress = document.getElementById("testprogress")
testprogress.onclick = () => {
    progress.classList.add("active")
    let i = 0
    progress.setAttribute("progress", 0)
    let ai = setInterval(() => {
        progress.setAttribute("progress", i)
        i++
        if (i == 100)
            setTimeout(() => {
                progress.classList.remove("active")
                clearInterval(ai)
            }, 5000)
    }, 200)
}

// TODO Rename 
// TODO copy, ...



