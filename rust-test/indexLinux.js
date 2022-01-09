const { initGtk, getIcon, getFiles } = require("../index.node")

console.log("Testing Rust (Javascript side)")

initGtk()

console.log("system icon", getIcon(".pdf", 16))

var files = getFiles("/home/uwe")
console.log("files")
console.log("files", files)


