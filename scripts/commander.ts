import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import { initializeMenu } from './menu'

export function activateClass(element: HTMLElement, cls: string, activate: boolean) {
    if (activate != false)
        element.classList.add(cls)
    else
        element.classList.remove(cls)
}

const titlebar = document.getElementById("titlebar")!
titlebar.setAttribute("no-titlebar", "")

initializeMenu()

activateClass(document.body, "adwaitaDark", false) 
activateClass(document.body, "adwaita", false) 
activateClass(document.body, "windows", false) 
activateClass(document.body, "windowsDark", false) 
activateClass(document.body, location.search.substring(7), true) 

const source = new EventSource("commander/sse")
source.addEventListener("open", function (event) {
    console.log("Connected")
})
  
// Let's skip ahead and set already our "reload" event
// source.addEventListener("reload", function (event: MessageEvent<any>) {
//     console.log("Reloading, file changed: ", event.data)
// })

// Listen to any message sent not tied to a particular event
source.addEventListener("message", function (event) {
    console.log(event)
    console.log(event.data)
})
  
source.addEventListener("error", function (err) {
    console.error(err)
})