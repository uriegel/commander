const { getIcon, getDrives, getFileVersion } = require("../index.node")

console.log("Testing Rust (Javascript side)...")

const getFileVersionAsnyc = file => new Promise(res => getFileVersion(file, res))

const getDrivesAsnyc = () => new Promise(res => getDrives(res))

const getIconAsnyc = (ext, size) => new Promise(res => getIcon(ext, size, (err, buffer) => res(buffer)))

async function runAsync() {

    const version = await getFileVersionAsnyc("c:\\windows\\regedit.exe")
    console.log("version", version)

    const drives = await getDrivesAsnyc()
    console.log("drives", drives)

    const buffer = await getIconAsnyc(".pdf", 16)
    console.log("Result getIcon", buffer, buffer.length)
}

runAsync()

console.log("End testing Rust (Javascript side)")