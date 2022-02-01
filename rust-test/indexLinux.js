const { test } = require("rust-addon")

console.log("Testing Rust (Javascript side)")

// //clearTimeout(timer)const trashFileAsync = file => new Promise((res, rej) => trashFile(file, err => err ? rej(err) : res()))
const testAsync = () => new Promise(res => test(res))

async function runTest(i) {
    console.log(`Running ${i}`)
    await testAsync()
    console.log(`Running ${i}  finished`)
}

async function run() {
    for (let i = 0; i < 20; i++) {
        runTest(i)
    }
}
run()

// initGtk()

// console.log("system icon", getIcon(".pdf", 16))

// //var timer = setTimeout(() => console.log("Progress", getCopyStatus()), 40)
// //var files = getFiles("/home/uwe")
// var files = getFiles(("/home/uwe"))
// //clearTimeout(timer)const trashFileAsync = file => new Promise((res, rej) => trashFile(file, err => err ? rej(err) : res()))
// console.log("files")
// console.log("files", files)

// const copyFileAsnyc = (source, target, cb, move, overwrite) => new Promise((res, rej) => {
//     var timer = setInterval(() => {
//         const status = getCopyStatus()
//         if (status)
//             cb(status)
//     }, 100)
//     copyFile(source, target, err => {
//         clearInterval(timer)
//         if (err)
//             rej(err)
//         else
//             res()
//     }, move || false, overwrite || false)
// })

// const getExifDateAsync = file => new Promise(res => getExifDate(file, date => res(date ? new Date(date) : null)))


// const run = async () => {

//     console.log("Exif date no file", await getExifDateAsync("/home/uwe/Bilder/Fotos/2021/Uwe/IMG_20210907_142241ddd.jpg"))
//     console.log("Exif date", await getExifDateAsync("/home/uwe/Bilder/Fotos/2021/Uwe/IMG_20210907_142241.jpg"))

//     try {
//         await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/affe.mts", a => console.log("Progress", a))
//     } catch (err) {
//         console.log("Err copy", err)
//     }
//     await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/affe.mts", a => console.log("Progress", a), false, true)
//     await trashFileAsync("/home/uwe/test/affe.mts")
//     await copyFileAsnyc("/home/uwe/Videos/raw/Goldeneye.mts", "/home/uwe/test/neuer/nocheiner/affe.mts", a => console.log("Progress", a), false, true)

//     try {
//         await trashFileAsync("/home/uwe/test/affe23.mts")
//     } catch (err) {
//         console.log("Err trashFileAsync", err)
//     }
//     try {
//         await trashFileAsync("/etc/cron.daily/google-chrome")
//     } catch (err) {
//         console.log("Err trashFileAsync", err)
//     }
// }

// run()

