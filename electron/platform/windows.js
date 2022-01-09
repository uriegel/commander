const { protocol } = require("electron")
const { getIcon74 } = require("../../index.node")


const { getIcon } = require("filesystem-utilities")


function registerGetIconProtocol() {
    protocol.registerBufferProtocol('icon', async (request, callback) => {
        const url = request.url
        var ext = url.substring(7)
        var icon = await getIcon(ext)
        callback({ mimeType: 'img/png', data: icon })
    }, (error) => {
        if (error) console.error('Failed to register protocol', error)
    })

    // protocol.registerFileProtocol('icon', async (request, callback) => {
    //     const url = request.url
    //     var ext = url.substring(7)
    //     var path = getIcon(ext, 16)
    //     callback(path)
    // })
}

exports.registerGetIconProtocol = registerGetIconProtocol
