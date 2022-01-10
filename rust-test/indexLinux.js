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

const copyFileAsnyc = () => new Promise(res => copyFile(res))

const run = async () => {
    var timer = setInterval(() => console.log("Progress", getCopyStatus()), 100)
    await copyFileAsnyc()
    clearInterval(timer)
}

run()

