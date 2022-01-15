const { protocol } = require("electron")
const { getIcon } = require("rust-addon")

function registerGetIconProtocol() {
    protocol.registerFileProtocol('icon', async (request, callback) => {
        const url = request.url
        var ext = url.substring(7)
        var path = getIcon(ext, 16)
        callback(path)
    })
}



exports.registerGetIconProtocol = registerGetIconProtocol