import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import 'grid-splitter'
import 'web-pie-progress'
import './components/folder'
import './components/externaladder'
import { Menubar, MenuItem } from 'web-menu-bar'
import { initialize as initializeMenu } from './menu'
import { refreshViewer, showViewer as viewer } from './viewer'
import { DialogBox } from 'web-dialog-box'
import { Platform } from './platforms/platforms'
import { Folder } from './components/folder'
//import { FolderItem } from './engines/engines'

export type Commander = {
    showViewer: (show: boolean)=>void
    hideMenu: (hide: boolean)=>void
    refresh: (folderId?: string)=>void
    adaptPath: ()=>void
    selectAll: ()=>void
    selectNone: ()=>void
    showHidden: (hidden: boolean)=>void 
    rename: ()=>void
}

// TODO engine externals create
// TODO engine externals rename
// TODO delete in all engines
// TODO createFolder


var currentPath = ""
const folderLeft = document.getElementById("folderLeft")! as Folder
const folderRight = document.getElementById("folderRight")! as Folder
var activeFolder = folderLeft

export const dialog = document.querySelector('dialog-box') as DialogBox

const statusText = document.getElementById("statusText")!
const dirsText = document.getElementById("dirs")!
const filesText = document.getElementById("files")!
const menu = document.getElementById("menu")! as Menubar

menu.addEventListener('menuclosed', () => activeFolder.setFocus())

folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)
folderLeft.addEventListener("pathChanged", onPathChanged)
folderRight.addEventListener("pathChanged", onPathChanged)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())

function showViewer(show: boolean) {
    viewer(show, currentPath)
}

function hideMenu(hide: boolean) {
    Platform.hideMenu(hide)
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

function refresh(folderId?: string) {
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

function getInactiveFolder() { return activeFolder == folderLeft ? folderRight : folderLeft }

function adaptPath() {
    getInactiveFolder().changePath(activeFolder.getCurrentPath())
}

function showHidden(hidden: boolean) {
    folderLeft.showHidden(hidden)
    folderRight.showHidden(hidden)
}

function rename() {
    activeFolder.renameItem()
}

const commander: Commander = {
    showViewer,
    hideMenu,
    refresh,
    adaptPath,
    selectAll,
    selectNone,
    showHidden,
    rename
}

Platform.adaptWindow(dialog, menu, document.getElementById("hidemenu") as MenuItem)

const themeChanges = window.require("theme-change-detect")
themeChanges.register((theme: any) => Platform.onDarkTheme(theme.isDark))
Platform.onDarkTheme(themeChanges.getTheme().isDark)

folderLeft.setFocus()
initializeMenu(commander)
