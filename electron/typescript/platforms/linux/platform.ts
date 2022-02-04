import { protocol } from "electron"
import { Platform } from "../platforms"
import { getIcon } from "rust-addon"

export class LinuxPlatform implements Platform {
    registerGetIconProtocol() {
        protocol.registerFileProtocol('icon', async (request, callback) => {
            const url = request.url
            var ext = url.substring(7)
            var path = getIcon(ext)
            callback(path)
        })
    }
}