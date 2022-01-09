const { getIcon } = require("../index.node")

console.log("Testing Rust (Javascript side)...")


getIcon(".pdf", 16, (err, buffer) => {
    console.log("ergebnis", err, buffer, buffer.length)
})

console.log("End testing Rust (Javascript side)")