import 'grid-splitter'
import 'web-dialog-box'
import { RESULT_CANCEL, RESULT_OK, RESULT_YES, RESULT_NO } from 'web-dialog-box'
import 'web-menu-bar'
import 'web-electron-titlebar'
import 'web-pie-progress'
import { initializeCopying, adaptWindow, onDarkTheme } from './platforms/switcher.js'
import './components/pdfviewer.js'
import './components/folder.js'
import './components/copyconflicts'
import { showViewer, refreshViewer} from './viewer.js'
import { initializeMenu } from './menu.js'
export const DIRECTORY = 1
export const FILE = 2
export const BOTH = 3

const FileResult = window.require('filesystem-utilities').FileResult

const folderLeft = document.getElementById("folderLeft")
const folderRight = document.getElementById("folderRight")
const dialog = document.querySelector('dialog-box')
const statusText = document.getElementById("statusText")
const dirsText = document.getElementById("dirs")
const filesText = document.getElementById("files")
const menu = document.getElementById("menu")

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

initializeCopying(onCopyFinish, onShowCopyErrors)

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
folderLeft.addEventListener("delete", evt => onDelete(evt.detail))
folderRight.addEventListener("delete", evt => onDelete(evt.detail))

async function copy(move) {
    const itemsToCopy = activeFolder.selectedItems
    const fromLeft = activeFolder == folderLeft
    const itemsType = getItemsTypes(itemsToCopy)    
    
    const inactiveFolder = getInactiveFolder()
    const copyInfo = await inactiveFolder.prepareCopyItems(
        fromLeft, itemsType, activeFolder.getCurrentPath(), itemsToCopy.map(n => n.name), move
    )
    const res = await dialog.show(copyInfo.dialogData)
    activeFolder.setFocus()
    if (res.result != RESULT_CANCEL) {
        if (res.result == RESULT_NO) 
            copyInfo.items = copyInfo.items.filter(n => !copyInfo.conflicts.find(m => m.source.file == n.file))
        await inactiveFolder.copyItems(copyInfo, move, res.result == RESULT_YES, move ? [activeFolder.id, inactiveFolder.id] : [inactiveFolder.id])
        if (move)
            await activeFolder.deleteEmptyFolders(itemsToCopy.filter(n => n.isDirectory).map(n => n.name), [activeFolder.id, inactiveFolder.id])
    }
}

async function rename() {
    try {
        const selectedItems = activeFolder.getSelectedItems()
        if (selectedItems.length != 1)    
            return
        const itemsType = getItemsTypes(selectedItems)
        const itemToRename = selectedItems[0].name
        const text = itemsType == FILE 
            ? "Datei umbenennen"
            : "Ordner umbenennen"
        
        const getInputRange = () => {
            const pos = itemToRename.lastIndexOf(".")
            if (pos == -1)
                return [0, itemToRename.length]
            else
                return [0, pos]
        }

        const res = await dialog.show({
            text,
            input: true,
            inputText: itemToRename,
            inputSelectRange: getInputRange(),
            btnOk: true,
            btnCancel: true,
            defBtnOk: true
        })    
        activeFolder.setFocus()
        if (res.result == RESULT_OK)
            await activeFolder.renameItem(itemToRename, res.input)
    } catch (e) {
        const text = e.fileResult == FileResult.AccessDenied
                ? "Zugriff verweigert"
                : "Die Aktion konnte nicht ausgeführt werden"
        setTimeout(async () => {
            await dialog.show({
                text,
                btnOk: true
            })
            activeFolder.setFocus()        
        },
        500)
    }
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

function onCopyFinish(folderIdsToRefresh) {
    folderIdsToRefresh.forEach(n => refresh(n))
}

async function onShowCopyErrors(errorContent) {
    await dialog.show(errorContent)
    activeFolder.setFocus()
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
    rename,
    selectAll,
    selectNone
}

initializeMenu(commander)





