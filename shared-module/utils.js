const fspath = require('path')
const { rmdir } = require('fs/promises')
const { getFiles, copyFile, getCopyStatus, trashFile, createDirectory } = require('../index.node')

async function deleteEmptyFolders(path, folders) {
    const folderPathes = folders.map(n => fspath.join(path, n))

    function getSubDirs(path) {
        path = fspath.normalize(path).replace(":.", ":\\")
        return getFiles(path)
            .filter(n => n.isDirectory)
            .map(n => fspath.join(path, n.name))
    }
    
    async function removeDirectory(folderPath) {
        var items = getSubDirs(folderPath)
        if (items.length > 0) {
            try {
                await Promise.all(items.map(removeDirectory))
            } catch (err)  {
                console.log("error while deleting empty folders", err)
            }
        }
        try {
            await rmdir(folderPath)
        } catch (err)  {
            console.log("error while deleting empty folder", err)
        }
    }

    try {
        await Promise.all(folderPathes.map(removeDirectory))
    } catch (err)  {
        console.log("error while deleting empty folders", err)
    }
}

const copyFileAsnyc = (source, target, cb, move, overwrite) => new Promise((res, rej) => {
    var timer = setInterval(() => {
        const status = getCopyStatus()
        if (status)
            cb(status)
    }, 100)
    copyFile(source, target, (err, copied) => {
        clearInterval(timer)
        if (err)
            rej(err)
        else {
            cb(copied)
            res()
        }
    }, move || false, overwrite || false)
})

const trashFileAsync = file => new Promise((res, rej) => trashFile(file, err => err ? rej(err) : res()))

const createFolder = path => new Promise((res, rej) => createDirectory(path, err => err ? rej(err) : res()))

var FileResult;
(function (FileResult) {
    FileResult[FileResult["Success"] = 0] = "Success";
    FileResult[FileResult["Unknown"] = 1] = "Unknown";
    FileResult[FileResult["AccessDenied"] = 2] = "AccessDenied";
    FileResult[FileResult["FileExists"] = 3] = "FileExists";
    FileResult[FileResult["FileNotFound"] = 4] = "FileNotFound";
    FileResult[FileResult["TrashNotPossible"] = 5] = "TrashNotPossible";
})(FileResult = exports.FileResult || (exports.FileResult = {}));

exports.deleteEmptyFolders = deleteEmptyFolders
exports.copyFile = copyFileAsnyc
exports.trashFile = trashFileAsync
exports.createFolder = createFolder
