const { initGtk, getIcon } = require("../index.node")

console.log("Testing Rust (Javascript side)")

initGtk()

console.log("system icon", getIcon(".pdf", 16))


