import { protocol } from "electron"
import { readFile, stat } from "fs/promises"
import path from "path"
import { rootDir } from "./main.js"

export function registerGetWindowIconProtocol() {
    protocol.handle('windowicon', async (request) => {
        try {
            const filePath = path.join(rootDir, "../../icons/64x64.png")
            const data = await readFile(filePath)
            const stats = await stat(filePath)
            return new Response(data as any, {
                headers: {
                    'Content-Type': 'image/png',
                    'Content-Length': stats.size.toString()
                } 
            })
        } catch (err) {
            console.error('Failed to load icon', err)
            return new Response('Icon not found', { status: 404 })
        }
    })
}
