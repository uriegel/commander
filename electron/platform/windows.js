const { protocol } = require("electron")
const { getIcon } = require("rust-addon")

const getIconAsnyc = ext => new Promise(res => getIcon(ext, 16, (err, buffer) => res(buffer)))

function registerGetIconProtocol() {
    protocol.registerBufferProtocol('icon', async (request, callback) => {
        const url = request.url
        var ext = url.substring(7)
        var icon = await getIconAsnyc(ext)
        callback({ mimeType: 'img/png', data: icon })
    }, (error) => {
        if (error) console.error('Failed to register protocol', error)
    })
}

exports.registerGetIconProtocol = registerGetIconProtocol
