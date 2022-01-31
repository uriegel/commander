const { Folder } = require("rust-addon")
console.log("Testing Rust (Javascript side)")

// initGtk()
const folder = new Folder()
folder.name = "Der Name des schönen Földerchens"
console.log("folder.name", folder.name)
