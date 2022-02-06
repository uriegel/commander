import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import 'grid-splitter'
import { Menubar, MenuItem } from 'web-menu-bar'
import { initialize as initializeMenu } from './menu'
import { showViewer as viewer } from './viewer'
import { createPlatform } from './platforms/platforms'
import { DialogBox } from 'web-dialog-box'

var currentPath = ""

// TODO theming

const platform = createPlatform()
const dialog = document.querySelector('dialog-box') as DialogBox

export type Commander = {
    showViewer: (show: boolean)=>void
    hideMenu: (hide: boolean)=>void
}

function showViewer(show: boolean) {
    currentPath = "/home/uwe/Bilder/Fotos/2019/Bild267.jpg"
    currentPath = "/home/uwe/Videos/Tatort - Fürchte Dich.mp4"
    //currentPath = "/home/uwe/Bücher/Beginning Blender.pdf"
    viewer(show, currentPath)
}

function hideMenu(hide: boolean) {
    platform.hideMenu(hide)
}

const commander: Commander = {
    showViewer,
    hideMenu
}

const menu = document.getElementById("menu")! as Menubar

platform.adaptWindow(dialog, menu, document.getElementById("hidemenu") as MenuItem)

initializeMenu(commander)
