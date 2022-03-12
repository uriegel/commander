import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import 'grid-splitter'
import 'web-pie-progress'
import './components/folder'
import { initializeMenu } from './menu'
import { Folder } from './components/folder'
import { Menubar } from 'web-menu-bar'

export function activateClass(element: HTMLElement, cls: string, activate: boolean) {
    if (activate != false)
        element.classList.add(cls)
    else
        element.classList.remove(cls)
}

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

type Event = 
    | EventNothing
    | EventThemeChanged

const source = new EventSource("commander/sse")
source.addEventListener("message", function (event) {
    const evt: Event = JSON.parse(event.data)
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

const folderLeft = document.getElementById("folderLeft")! as Folder
const folderRight = document.getElementById("folderRight")! as Folder
var activeFolder = folderLeft

const menu = document.getElementById("menu")! as Menubar
menu.addEventListener('menuclosed', () => activeFolder.setFocus())
folderLeft.addEventListener("onFocus", () => activeFolder = folderLeft)
folderRight.addEventListener("onFocus", () => activeFolder = folderRight)
folderLeft.addEventListener("tab", () => folderRight.setFocus())
folderRight.addEventListener("tab", () => folderLeft.setFocus())

folderLeft.setFocus()