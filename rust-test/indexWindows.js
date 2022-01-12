const { getIcon, getDrives } = require("../index.node")

console.log("Testing Rust (Javascript side)...")


const getDrivesAsnyc = () => new Promise(res => getDrives(res))

const getIconAsnyc = (ext, size) => new Promise(res => getIcon(ext, size, (err, buffer) => res(buffer)))

async function runAsync() {

    const drives = await getDrivesAsnyc()
    console.log("drives", drives)

    const buffer = await getIconAsnyc(".pdf", 16)
    console.log("Result getIcon", buffer, buffer.length)
}

runAsync()

console.log("End testing Rust (Javascript side)")