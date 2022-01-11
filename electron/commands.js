const { protocol } = require("electron")
const { copy, trash } = require("filesystem-utilities")
const { createFolder, deleteEmptyFolders } = require("shared-module")

const registerRunCmd = () => {
    protocol.registerStringProtocol('http', async (request, callback) => {
        const input = JSON.parse(request.uploadData[0].bytes)
        switch (input.method) {
            case "createFolder":
                try {
                    await createFolder(input.path)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "copy":
                try {
                    const sources = input.copyInfo.items.map(n => n.file)
                    const targets = input.copyInfo.items.map(n => n.targetFile)
                    await copy(sources, targets, input.move)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "trash":
                try {
                    await trash(input.items)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
                break
            case "rename":
                try {
                    await copy(input.item, input.newName, true)
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
    }, (error) => {
        if (error)
            console.error('Failed to register http protocol', error)
    })
}

exports.registerRunCmd = registerRunCmd