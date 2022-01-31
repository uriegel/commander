const { test } = require("rust-addon")

console.log("Testing Rust (Javascript side)")

// initGtk()
const res = test("Hallo", "Wörld")
console.log("res", res)
