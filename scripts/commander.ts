import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import 'grid-splitter'
import 'web-pie-progress'
import './components/folder'
import { initializeMenu } from './menu'
import { Folder } from './components/folder'
import { Menubar } from 'web-menu-bar'
import { refreshViewer, showViewer as viewer } from './viewer'

export function activateClass(element: HTMLElement, cls: string, activate: boolean) {
    if (activate != false)
        element.classList.add(cls)
    else
        element.classList.remove(cls)
}

const statusText = document.getElementById("statusText")!
const dirsText = document.getElementById("dirs")!
const filesText = document.getElementById("files")!
const titlebar = document.getElementById("titlebar")!
titlebar.setAttribute("no-titlebar", "")

initializeMenu()

setTheme(location.search.substring(7)) 

type EventNothing = {
    Case: "Nothing"
}

type EventThemeChanged = {
    Case: "ThemeChanged",
    Fields: string[1]
}

type CommanderEvent = 
    | EventNothing
    | EventThemeChanged

var currentPath = ""
const source = new EventSource("commander/sse")
source.addEventListener("message", function (event) {
    const evt: CommanderEvent = JSON.parse(event.data)
    switch (evt.Case) {
        case "ThemeChanged":
            setTheme(evt.Fields[0])    
            break
    }
})

function setTheme(theme: string) {
    activateClass(document.body, "adwaitaDark", false) 
    activateClass(document.body, "adwaita", false) 
    activateClass(document.body, "windows", false) 
    activateClass(document.body, "windowsDark", false) 
    activateClass(document.body, theme, true) 
}

function getInactiveFolder() { return activeFolder == folderLeft ? folderRight : folderLeft }

export function onAdaptPath() {
    getInactiveFolder().changePath(activeFolder.getCurrentPath())
}

export function onRefresh() {
    activeFolder.reloadItems()
}

export function onSelectAll() {
    activeFolder.selectAll()
}

export function onSelectNone() {
    activeFolder.selectNone()
}

export function onViewer(show: boolean) {
    viewer(show, currentPath)
}

export function onSetHidden(showHidden: boolean) {
    folderLeft.showHidden(showHidden)
    folderRight.showHidden(showHidden)
}

export function activeFolderSetFocus() {
    activeFolder.setFocus()
}

function onPathChanged(evt: Event) {
    const detail = (evt as CustomEvent).detail
    currentPath = detail.path
    refreshViewer(detail.path)
    setStatus(detail.path, detail.dirs, detail.files)
}

function setStatus(path: string, dirs: number, files: number) {
    statusText.innerText = `${path}`
    dirsText.innerText = `${dirs ? dirs - 1 : "" } Verz.` 
    filesText.innerText = `${dirs ? files : "" } Dateien` 
}

const folderLeft = document.getElementById("folderLeft")! as Folder
const folderRight = document.getElementById("folderRight")! as Folder
var activeFolder = folderLeft

const menu = document.getElementById("menu")! as Menubar
menu.addEventListener('menuclosed', () => activeFolder.setFocus())
folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)
folderLeft.addEventListener("pathChanged", onPathChanged)
folderRight.addEventListener("pathChanged", onPathChanged)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())

folderLeft.setFocus()