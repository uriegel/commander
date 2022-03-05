import { request, ShowDevTools, ShowFullscreen } from "./requests"
export function initializeMenu() {}

window.onClose = () => close()
window.onDevTools = async () => await request(ShowDevTools)
window.onFullscreen = async () => await request(ShowFullscreen)