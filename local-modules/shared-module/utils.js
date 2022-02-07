const fspath = require('path')
const { rmdir } = require('fs/promises')
const { getFiles, copyFile, getCopyStatus } = require('rust-addon')

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

async function copyFileAsnyc(source, target, cb, move, overwrite) {
    var timer = setInterval(() => {
        const status = getCopyStatus()
        if (status)
            cb(status)
    }, 100)
    try {
        await copyFile(source, target, move || false, overwrite || false)
        clearInterval(timer)
    } catch (e) {
        throw (JSON.parse(e.message))
    } finally {
        clearInterval(timer)
    }
}

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
