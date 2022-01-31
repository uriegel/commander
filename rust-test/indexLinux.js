const { changePath } = require("rust-addon")
console.log("Testing Rust (Javascript side)")

// initGtk()
changePath(1)
changePath(2, "def geänderte Pfad 👹", true)

