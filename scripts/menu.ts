import { request, ShowDevTools } from "./requests"
export function initializeMenu() {}

window.onClose = () => close()
window.onDevTools = async () => await request(ShowDevTools)