const { changePath } = require("rust-addon")
console.log("Testing Rust (Javascript side)")

// initGtk()

async function run() {
    await changePath(1)
    await changePath(2, "def geänderte Pfad 👹", true)
}
run()

