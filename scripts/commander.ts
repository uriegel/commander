import 'web-electron-titlebar'
import 'web-menu-bar'
import 'web-dialog-box'
import { initializeMenu } from './menu'

const titlebar = document.getElementById("titlebar")!
titlebar.setAttribute("no-titlebar", "")

initializeMenu()

const source = new EventSource("commander/sse")
source.addEventListener("open", function (event) {
    console.log("Connected")
})
  
// Let's skip ahead and set already our "reload" event
source.addEventListener("reload", function (event) {
    console.log("Reloading, file changed: ", event.data)
})

// Listen to any message sent not tied to a particular event
source.addEventListener("message", function (event) {
    console.log(event)
    console.log(event.data)
})
  
source.addEventListener("error", function (err) {
    console.error(err)
})