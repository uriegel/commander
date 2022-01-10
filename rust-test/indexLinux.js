const { initGtk, getIcon, getFiles, copyFile, getCopyStatus } = require("../index.node")

console.log("Testing Rust (Javascript side)")

initGtk()

console.log("system icon", getIcon(".pdf", 16))



//var timer = setTimeout(() => console.log("Progress", getCopyStatus()), 40)
//var files = getFiles("/home/uwe")
var files = getFiles(("/home/uwe"))
//clearTimeout(timer)
console.log("files")
console.log("files", files)

const copyFileAsnyc = (source, target, cb, move, overwrite) => new Promise((res, rej) => {
    var timer = setInterval(() => {
        const status = getCopyStatus()
        if (status)
            cb(status)
    }, 100)
    copyFile(source, target, err => {
        clearInterval(timer)
        if (err)
            rej(err)
        else
            res()
    }, move || false, overwrite || false)
})

const run = async () => {
    try {
        await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/affe.mts", a => console.log("Progress", a))
    } catch (err) {
        console.log("Err copy", err)
    }
    await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/affe.mts", a => console.log("Progress", a), false, true)
    await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/neuer/nocheiner/affe.mts", a => console.log("Progress", a), false, true)
}

run()

