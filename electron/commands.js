const { protocol } = require("electron")
const { createFolder } = require("filesystem-utilities")

const registerRunCmd = () => {
    protocol.registerStringProtocol('http', async (request, callback) => {
        var input = JSON.parse(request.uploadData[0].bytes)
        switch (input.method) {
            case "createFolder":
                try {
                    const res = await createFolder(input.path)
                } catch (e) {
                    
                }
                break
        }
        callback(JSON.stringify(23))
    }, (error) => {
        if (error)
            console.error('Failed to register http protocol', error)
    })
}

exports.registerRunCmd = registerRunCmd