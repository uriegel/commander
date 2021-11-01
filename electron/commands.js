const { protocol } = require("electron")
const { createFolder, FileResult } = require("filesystem-utilities")

const registerRunCmd = () => {
    protocol.registerStringProtocol('http', async (request, callback) => {
        const input = JSON.parse(request.uploadData[0].bytes)
        let result = FileResult.OK
        switch (input.method) {
            case "createFolder":
                try {
                    await createFolder(input.path)
                } catch (e) {
                    result = e.res 
                }
                break
        }
        callback(JSON.stringify({result}))
    }, (error) => {
        if (error)
            console.error('Failed to register http protocol', error)
    })
}

exports.registerRunCmd = registerRunCmd