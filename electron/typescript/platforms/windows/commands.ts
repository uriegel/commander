import * as fspath from 'path'
import { protocol } from "electron"
import { copyFiles, toRecycleBin, createDirectory, getFiles } from "rust-addon"
import { rmdir } from 'fs/promises'

export const registerCommands = () => {
    protocol.registerStringProtocol('http', async (request, callback) => {
        const input = JSON.parse(request.uploadData![0].bytes as unknown as string)
        switch (input.method) {
            case "createFolder":
                try {
                    await createDirectory(input.path)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "copy":
                try {
                    const sources = input.copyInfo.items.map((n: any) => n.file)
                    const targets = input.copyInfo.items.map((n: any) => n.targetFile)
                    await copyFiles(sources, targets, input.move)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "trash":
                try {
                    await toRecycleBin(input.items)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "rename":
                try {
                    await copyFiles([input.item], [input.newName], true)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "deleteEmptyFolders":
                try {
                    await deleteEmptyFolders(input.path, input.folders)
                } catch (exception) {
                    console.log(exception)
                }
                callback(JSON.stringify({}))
                break
            default:
                callback(JSON.stringify({ exception: "Method not implemented" }))
                break
        }
    })
}

async function deleteEmptyFolders(path: string, folders: string[]) {
    const folderPathes = folders.map(n => fspath.join(path, n))

    function getSubDirs(path: string) {
        path = fspath.normalize(path).replace(":.", ":\\")
        return getFiles(path)
            .filter(n => n.isDirectory)
            .map(n => fspath.join(path, n.name))
    }
    
    async function removeDirectory(folderPath: string) {
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

