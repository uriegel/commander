const { protocol } = require("electron")
const { createFolder, copy, trash } = require("filesystem-utilities")

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
                    await copy(input.sourcePath, input.targetPath, input.items, input.move)
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
                    await copy(input.sourcePath, input.targetPath, input.items, input.move)
                    await rename(input.item, input.newName)
                    callback(JSON.stringify({}))
                } catch (exception) {
                    callback(JSON.stringify({ exception }))
                }
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