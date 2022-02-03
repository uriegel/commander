const { getIcon, getDrives, getFileVersion, toRecycleBin } = require("rust-addon")

console.log("Testing Rust (Javascript side)...")

// const getFileVersionAsnyc = file => new Promise(res => getFileVersion(file, res))

// const toRecycleBinAsync = files => new Promise((res, rej) => toRecycleBin(files, err => {
//     if (err)
//         rej(err)
//     else
//         res()
// }))

async function runAsync() {

// //    await toRecycleBinAsync(["C:\\Users\\urieg\\OneDrive\\Desktop\\Ordner\\Ali.mkv", "C:\\Users\\urieg\\OneDrive\\Desktop\\Ordner\\Dinos"])
//     await toRecycleBinAsync(["C:\\windows\\Ali.mkv"])

//     const version = await getFileVersionAsnyc("c:\\windows\\regedit.exe")
//     console.log("version", version)
//     const versionno = await getFileVersionAsnyc("c:\\windows\\setuperr.log")
//     console.log("versionno", versionno)

    const drives = await getDrives()
    console.log("drives", drives)

    const buffer = await getIcon(".pdf", 16)
    console.log("Result getIcon", buffer, buffer.length)
}

runAsync()

console.log("End testing Rust (Javascript side)")