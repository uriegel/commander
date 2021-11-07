const { protocol } = require("electron")
const { createFolder, FileResult } = require("filesystem-utilities")

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