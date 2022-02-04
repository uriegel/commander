import { protocol } from "electron"
import { Platform } from "../platforms"
import { getIcon } from "rust-addon"

export class LinuxPlatform implements Platform {
    registerGetIconProtocol() {
        protocol.registerFileProtocol('icon', async (request, callback) => {
            const url = request.url
            const ext = url.substring(7)
            const path = getIcon(ext) as string
            callback(path)
        })
    }
}