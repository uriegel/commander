import 'web-electron-titlebar'
import 'web-menu-bar'
import 'grid-splitter'
import { Menubar } from 'web-menu-bar'
import { initialize as initializeMenu } from './menu'
import { showViewer as viewer } from './viewer'
import { createPlatform } from './platforms/platforms'

var currentPath = ""

// TODO Electron titlebar 
// TODO theming


export type Commander = {
    showViewer: (show: boolean)=>void
}

function showViewer(show: boolean) {
    currentPath = "/home/uwe/Bilder/Fotos/2019/Bild267.jpg"
    currentPath = "/home/uwe/Videos/Tatort - Fürchte Dich.mp4"
    //currentPath = "/home/uwe/Bücher/Beginning Blender.pdf"
    viewer(show, currentPath)
}

const commander: Commander = {
    showViewer
}

const menu = document.getElementById("menu")! as Menubar

const platform = createPlatform()
platform.adaptWindow(menu)

initializeMenu(commander)
