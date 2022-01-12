const { getIcon, getDrives, getFileVersion, toRecycleBin } = require("../index.node")

console.log("Testing Rust (Javascript side)...")

const getFileVersionAsnyc = file => new Promise(res => getFileVersion(file, res))

const toRecycleBinAsync = files => new Promise((res, rej) => toRecycleBin(files, err => {
    if (err)
        rej(err)
    else
        res()
}))

const getDrivesAsnyc = () => new Promise(res => getDrives(res))

const getIconAsnyc = (ext, size) => new Promise(res => getIcon(ext, size, (err, buffer) => res(buffer)))

async function runAsync() {

//    await toRecycleBinAsync(["C:\\Users\\urieg\\OneDrive\\Desktop\\Ordner\\Ali.mkv", "C:\\Users\\urieg\\OneDrive\\Desktop\\Ordner\\Dinos"])
    await toRecycleBinAsync(["C:\\windows\\Ali.mkv"])

    const version = await getFileVersionAsnyc("c:\\windows\\regedit.exe")
    console.log("version", version)
    const versionno = await getFileVersionAsnyc("c:\\windows\\setuperr.log")
    console.log("versionno", versionno)

    const drives = await getDrivesAsnyc()
    console.log("drives", drives)

    const buffer = await getIconAsnyc(".pdf", 16)
    console.log("Result getIcon", buffer, buffer.length)
}

runAsync()

console.log("End testing Rust (Javascript side)")