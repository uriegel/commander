import 'web-electron-titlebar'
import 'web-menu-bar'
import 'grid-splitter'
import { initialize as initializeMenu } from './menu'
import { showViewer as viewer } from './viewer'

var currentPath = ""

// TODO Electron titlebar 
// TODO menu 
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

initializeMenu(commander)
