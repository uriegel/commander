import 'web-electron-titlebar'
import 'web-menu-bar'
import { initializeMenu } from './menu'

const titlebar = document.getElementById("titlebar")!
titlebar.setAttribute("no-titlebar", "")

initializeMenu()