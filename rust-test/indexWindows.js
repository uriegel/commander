const { getIcon } = require("../index.node")

console.log("Testing Rust (Javascript side)...")


getIcon(".pdf", 16, (err, obj) => {
    console.log("ergebnis", err, obj)
})

console.log("End testing Rust (Javascript side)")