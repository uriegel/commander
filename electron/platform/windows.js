const { protocol } = require("electron")
const { getIcon } = require("rust-addon")

function registerGetIconProtocol() {
    protocol.registerBufferProtocol('icon', async (request, callback) => {
        const url = request.url
        var ext = url.substring(7)
        var icon = await getIcon(ext, 16)
        callback({ mimeType: 'img/png', data: icon })
    }, (error) => {
        if (error) console.error('Failed to register protocol', error)
    })
}

exports.registerGetIconProtocol = registerGetIconProtocol
