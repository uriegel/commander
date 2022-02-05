import { protocol } from "electron"
import { Platform } from "../platforms"
import { getIconAsync } from "rust-addon"
import { registerCommands } from "./commands"

export class WindowsPlatform implements Platform {
    registerGetIconProtocol() {
        protocol.registerBufferProtocol('icon', async (request, callback) => {
            const url = request.url
            const ext = url.substring(7)
            const icon = await getIconAsync(ext)
            callback({ mimeType: 'img/png', data: icon })
        })
    }
    registerCommands() { registerCommands() }
}

