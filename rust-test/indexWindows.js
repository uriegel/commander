const { getIcon, getDrives } = require("../index.node")

console.log("Testing Rust (Javascript side)...")


const getDrivesAsnyc = (ext, size) => new Promise(res => getDrives(ext, size, (err, buffer) => res(buffer)))

const getIconAsnyc = (ext, size) => new Promise(res => getIcon(ext, size, (err, buffer) => res(buffer)))

async function runAsync() {

    await getDrivesAsnyc()

    const buffer = await getIconAsnyc(".pdf", 16)
    console.log("Result getIcon", buffer, buffer.length)
}

runAsync()

console.log("End testing Rust (Javascript side)")